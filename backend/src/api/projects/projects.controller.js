const {
  ChatGoogleGenerativeAI,
  GoogleGenerativeAIEmbeddings,
} = require("@langchain/google-genai");
const { PGVectorStore } = require("@langchain/community/vectorstores/pgvector");
const { PromptTemplate } = require("@langchain/core/prompts");
const {
  createStuffDocumentsChain,
} = require("langchain/chains/combine_documents");
const db = require("../../config/db");
const { TABLE_NAMES } = require("../../config/constants");

// API để tạo project mới
exports.createProject = async (req, res) => {
  const { name, description } = req.body;
  // Tạm thời hardcode userId, sẽ thay bằng user từ token ở các tuần sau
  const userId = "12b8b51d-625f-4eb1-830f-29a8e1a9686c";
  try {
    const [newProject] = await db(TABLE_NAMES.PROJECTS)
      .insert({
        user_id: userId,
        name: name,
        description: description,
      })
      .returning("*");
    res.status(201).json(newProject);
  } catch (error) {
    console.error("Lỗi tạo project:", error);
    res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
};

// API để truy vấn
exports.queryProject = async (req, res) => {
  const { projectId } = req.params;
  const { question } = req.body;
  if (!question) {
    return res.status(400).json({ message: "Vui lòng đặt câu hỏi." });
  }

  try {
    const llm = new ChatGoogleGenerativeAI({
      model: "models/gemini-1.5-flash-002",
      apiKey: process.env.GOOGLE_API_KEY,
    });
    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GOOGLE_API_KEY,
    });
    const config = {
      postgresConnectionOptions: db.client.connectionSettings,
      tableName: TABLE_NAMES.EMBEDDINGS,
      columns: {
        idColumnName: "id",
        vectorColumnName: "embedding",
        contentColumnName: "content",
        metadataColumnName: "metadata",
      },
    };
    const pgvectorStore = await PGVectorStore.initialize(embeddings, config);

    const relevantDocs = await pgvectorStore.similaritySearch(question, 4, {
      projectId: projectId,
    });
    console.log(
      `Tìm thấy ${relevantDocs.length} tài liệu liên quan trực tiếp.`
    );

    const template = `Bạn là một trợ lý AI chuyên nghiệp. Hãy trả lời câu hỏi của người dùng chỉ dựa vào nội dung được cung cấp sau đây:
    <context>{context}</context>
    Câu hỏi: {input}`;
    const prompt = PromptTemplate.fromTemplate(template);

    const combineDocsChain = await createStuffDocumentsChain({ llm, prompt });
    const result = await combineDocsChain.invoke({
      input: question,
      context: relevantDocs,
    });

    res.status(200).json({ answer: result });
  } catch (error) {
    console.error("Lỗi khi truy vấn:", error);
    res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
};
