const db = require("../config/db");
const { TABLE_NAMES } = require("../config/constants");
const { getVectorStore } = require("./vectorstore.service");
const { summarizeText } = require("./ai.service"); // Giả sử ai.service đã có
const { PromptTemplate } = require("@langchain/core/prompts");
const {
  createStuffDocumentsChain,
} = require("langchain/chains/combine_documents");
const { ChatGoogleGenerativeAI } = require("@langchain/google-genai"); // Chỉ dùng để tạo chain, không khởi tạo lại llm

// Khởi tạo llm một lần
const llm = new ChatGoogleGenerativeAI({
  model: process.env.GOOGLE_GEMINI_MODEL || "models/gemini-1.5-flash-latest",
  apiKey: process.env.GOOGLE_API_KEY,
});

/**
 * Helper function to check project ownership. Throws an error if not owner.
 */
const verifyProjectOwnership = async (projectId, userId, dbInstance = db) => {
  const project = await dbInstance(TABLE_NAMES.PROJECTS)
    .where({ id: projectId, user_id: userId })
    .first();
  if (!project) {
    const error = new Error(
      "Không tìm thấy dự án hoặc bạn không có quyền truy cập."
    );
    error.statusCode = 404;
    throw error;
  }
  return project;
};

const createProjectForUser = async (projectData, userId) => {
  const { name, description } = projectData;
  const [newProject] = await db(TABLE_NAMES.PROJECTS)
    .insert({ user_id: userId, name, description })
    .returning("*");
  return newProject;
};

const findProjectsByUser = (userId) => {
  return db(TABLE_NAMES.PROJECTS)
    .where({ user_id: userId })
    .orderBy("updated_at", "desc");
};

const findProjectDetails = async (projectId, userId) => {
  return await verifyProjectOwnership(projectId, userId);
};

const findDocumentsInProject = async (projectId, userId) => {
  await verifyProjectOwnership(projectId, userId); // Verify access first
  return db(TABLE_NAMES.DOCUMENTS)
    .where({ project_id: projectId })
    .orderBy("created_at", "desc");
};

const performQueryOnProject = async (projectId, question, userId) => {
  await verifyProjectOwnership(projectId, userId); // Verify access

  const vectorStore = await getVectorStore();

  // Tìm các tài liệu liên quan trong project cụ thể
  const relevantDocs = await vectorStore.similaritySearch(question, 4, {
    projectId: projectId,
  });
  console.log(
    `Tìm thấy ${relevantDocs.length} tài liệu liên quan cho câu hỏi.`
  );

  const template = `Bạn là một trợ lý AI chuyên nghiệp, luôn trả lời bằng tiếng Việt. Hãy trả lời câu hỏi của người dùng chỉ dựa vào nội dung được cung cấp sau đây. Hãy sử dụng định dạng Markdown (ví dụ: dùng **in đậm**, *in nghiêng*, và các danh sách) để câu trả lời được rõ ràng và dễ đọc. Nếu nội dung không chứa thông tin để trả lời, hãy nói rằng "Tôi không tìm thấy thông tin để trả lời câu hỏi này trong tài liệu."
    <context>{context}</context>
    Câu hỏi: {input}`;
  const prompt = PromptTemplate.fromTemplate(template);

  const combineDocsChain = await createStuffDocumentsChain({ llm, prompt });
  return combineDocsChain.invoke({
    input: question,
    context: relevantDocs,
  });
};

const deleteProjectAndData = async (projectId, userId) => {
  const trx = await db.transaction();
  try {
    await verifyProjectOwnership(projectId, userId, trx); // Check ownership within transaction

    const documents = await trx(TABLE_NAMES.DOCUMENTS)
      .where({ project_id: projectId })
      .select("id");
    const documentIds = documents.map((d) => d.id);

    if (documentIds.length > 0) {
      // Xóa embeddings liên quan một cách chính xác
      await trx(TABLE_NAMES.EMBEDDINGS)
        .whereIn(db.raw(`metadata->>'documentId'`), documentIds)
        .del();
    }

    // Xóa documents (đã được cascade hoặc xóa thủ công)
    await trx(TABLE_NAMES.DOCUMENTS).where({ project_id: projectId }).del();

    // Xóa project
    const [deletedProject] = await trx(TABLE_NAMES.PROJECTS)
      .where({ id: projectId })
      .del()
      .returning("*");

    await trx.commit();
    // Cần thêm logic xóa file vật lý ở đây nếu có
    return deletedProject;
  } catch (error) {
    await trx.rollback();
    throw error;
  }
};

const createQuizFromDocuments = async (quizOptions, userId) => {
  const { documentIds, numQuestions, difficulty } = quizOptions;

  // Lấy nội dung và kiểm tra quyền sở hữu cho từng tài liệu
  const chunks = await db(TABLE_NAMES.EMBEDDINGS)
    .select(
      `${TABLE_NAMES.EMBEDDINGS}.content`,
      `${TABLE_NAMES.DOCUMENTS}.project_id`
    )
    .join(
      TABLE_NAMES.DOCUMENTS,
      db.raw(`??.id::text`, [TABLE_NAMES.DOCUMENTS]),
      db.raw(`??.metadata->>'documentId'`, [TABLE_NAMES.EMBEDDINGS])
    )
    .whereIn(
      db.raw(`??.metadata->>'documentId'`, [TABLE_NAMES.EMBEDDINGS]),
      documentIds
    );

  if (chunks.length === 0) {
    const error = new Error(
      "Không tìm thấy nội dung cho các tài liệu đã chọn."
    );
    error.statusCode = 404;
    throw error;
  }

  // Kiểm tra xem người dùng có quyền truy cập vào tất cả các dự án chứa tài liệu này không
  const projectIds = [...new Set(chunks.map((c) => c.project_id))];
  for (const projectId of projectIds) {
    await verifyProjectOwnership(projectId, userId);
  }

  const fullText = chunks.map((c) => c.content).join("\n\n");

  const template = `Bạn là một chuyên gia giáo dục. Dựa vào nội dung sau, hãy tạo ${numQuestions} câu hỏi trắc nghiệm ở mức độ ${difficulty}.
    YÊU CẦU: Trả lời bằng một mảng JSON hợp lệ. Mỗi object trong mảng phải có key: "question", "options" (mảng 4 string), và "answer" (string khớp với 1 trong các options).
    <nội dung>${fullText}</nội dung>
    Mảng JSON của bạn:`;

  const result = await llm.invoke(template);
  const jsonMatch = result.content.match(/(\[[\s\S]*\])/);
  if (!jsonMatch) {
    throw new Error("AI đã không trả về một mảng JSON hợp lệ.");
  }
  return JSON.parse(jsonMatch[0]);
};

module.exports = {
  createProjectForUser,
  findProjectsByUser,
  findProjectDetails,
  findDocumentsInProject,
  performQueryOnProject,
  deleteProjectAndData,
  createQuizFromDocuments,
};
