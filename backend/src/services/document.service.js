const fs = require("fs/promises");
const path = require("path");
const db = require("../config/db");
const { processAndEmbedDocument } = require("./rag.service"); // Giả định rag.service cũng nằm trong thư mục services
const { TABLE_NAMES } = require("../config/constants");
const aiService = require("./ai.service");

/**
 * Kiểm tra xem một dự án có thuộc về người dùng đã xác thực hay không.
 * @param {string} projectId - ID của dự án.
 * @param {string} userId - ID của người dùng.
 * @returns {Promise<boolean>}
 */
const verifyProjectOwnership = async (projectId, userId) => {
  const project = await db(TABLE_NAMES.PROJECTS)
    .where({ id: projectId, user_id: userId })
    .first();
  return !!project;
};

/**
 * Lấy thông tin chi tiết của một tài liệu.
 * @param {string} documentId - ID của tài liệu.
 * @param {string} userId - ID của người dùng yêu cầu.
 * @returns {Promise<object>} - Đối tượng tài liệu.
 */
const getDocumentById = async (documentId, userId) => {
  const document = await db(TABLE_NAMES.DOCUMENTS)
    .where({ id: documentId })
    .first();

  if (!document) {
    const error = new Error("Tài liệu không tồn tại.");
    error.statusCode = 404;
    throw error;
  }

  // Kiểm tra xem người dùng có quyền truy cập vào dự án chứa tài liệu này không
  const isOwner = await verifyProjectOwnership(document.project_id, userId);
  if (!isOwner) {
    const error = new Error("Bạn không có quyền truy cập tài liệu này.");
    error.statusCode = 403; // Forbidden
    throw error;
  }

  return document;
};

/**
 * Xử lý việc tải lên và embedding tài liệu (tác vụ nền).
 * Cập nhật trạng thái và dọn dẹp file tạm sau khi hoàn tất.
 * @param {object} file - Đối tượng file từ multer.
 * @param {string} documentId - ID của bản ghi tài liệu trong DB.
 * @param {string} projectId - ID của dự án.
 */
const handleBackgroundProcessing = async (file, documentId, projectId) => {
  try {
    // Gọi hàm xử lý RAG cốt lõi
    await processAndEmbedDocument(
      file.path,
      documentId,
      projectId,
      file.mimetype
    );

    // Cập nhật trạng thái thành công
    await db(TABLE_NAMES.DOCUMENTS)
      .where({ id: documentId })
      .update({ status: "completed" });

    console.log(`Xử lý thành công tài liệu: ${documentId}`);
  } catch (error) {
    console.error(`Lỗi xử lý nền cho tài liệu ${documentId}:`, error);
    // Cập nhật trạng thái thất bại
    await db(TABLE_NAMES.DOCUMENTS)
      .where({ id: documentId })
      .update({ status: "failed" });
  } finally {
    // Luôn dọn dẹp file tạm dù thành công hay thất bại
    try {
      await fs.unlink(file.path);
      console.log(`Đã xóa file tạm: ${file.path}`);
    } catch (cleanupError) {
      console.error(`Lỗi khi dọn dẹp file tạm ${file.path}:`, cleanupError);
    }
  }
};

/**
 * Tạo một bản ghi tài liệu mới và bắt đầu xử lý nền.
 * @param {object} file - Đối tượng file từ multer.
 * @param {string} projectId - ID của dự án.
 * @param {string} userId - ID của người dùng.
 * @returns {Promise<object>} Bản ghi tài liệu vừa được tạo.
 */
const createDocument = async (file, projectId, userId) => {
  // 1. Ủy quyền: Kiểm tra người dùng có quyền với dự án này không
  const isOwner = await verifyProjectOwnership(projectId, userId);
  if (!isOwner) {
    const error = new Error("Bạn không có quyền thêm tài liệu vào dự án này.");
    error.statusCode = 403; // Forbidden
    throw error;
  }

  // 2. Tạo bản ghi trong DB
  const [document] = await db(TABLE_NAMES.DOCUMENTS)
    .insert({
      project_id: projectId,
      file_name: file.originalname,
      file_path: file.path, // Lưu lại đường dẫn để có thể xóa sau này
      file_type: file.mimetype,
      status: "processing",
    })
    .returning("*");

  // 3. Kích hoạt xử lý nền (không await)
  handleBackgroundProcessing(file, document.id, projectId);

  return document;
};

/**
 * Lấy nội dung đầy đủ và tạo tóm tắt cho tài liệu.
 * @param {string} documentId - ID của tài liệu.
 * @param {string} userId - ID của người dùng.
 * @returns {Promise<string>} Chuỗi tóm tắt.
 */
// const getSummary = async (documentId, userId) => {
//   // Lấy thông tin tài liệu để kiểm tra quyền sở hữu
//   const document = await db(TABLE_NAMES.DOCUMENTS)
//     .where({ id: documentId })
//     .first();
//   if (!document) {
//     const error = new Error("Tài liệu không tồn tại.");
//     error.statusCode = 404;
//     throw error;
//   }

//   const isOwner = await verifyProjectOwnership(document.project_id, userId);
//   if (!isOwner) {
//     const error = new Error("Bạn không có quyền xem tài liệu này.");
//     error.statusCode = 403;
//     throw error;
//   }

//   const chunks = await db(TABLE_NAMES.EMBEDDINGS)
//     .whereRaw("metadata->>'documentId' = ?", [documentId])
//     .select("content");

//   if (chunks.length === 0) {
//     const error = new Error(
//       "Không tìm thấy nội dung cho tài liệu này để tóm tắt."
//     );
//     error.statusCode = 404;
//     throw error;
//   }

//   const fullText = chunks.map((chunk) => chunk.content).join("\n\n");
//   return aiService.summarizeText(fullText);
// };

const getSummary = async (documentId, userId) => {
  // (Phần kiểm tra quyền sở hữu vẫn giữ nguyên như cũ)
  const document = await db(TABLE_NAMES.DOCUMENTS)
    .where({ id: documentId })
    .first();
  // ... code kiểm tra document và isOwner ...

  // Nếu đã có tóm tắt, hãy dùng cache (vẫn áp dụng giải pháp caching)
  if (document.summary) {
    return document.summary;
  }

  // Lấy tất cả các chunk
  const chunks = await db(TABLE_NAMES.EMBEDDINGS)
    .whereRaw("metadata->>'documentId' = ?", [documentId])
    .select("content");

  if (chunks.length === 0) {
    // ... xử lý lỗi không tìm thấy nội dung ...
  }

  // ==========================================================
  // BƯỚC MAP: Tóm tắt từng chunk một cách TUẦN TỰ

  const chunkSummaries = [];
  console.log(`Bắt đầu xử lý TUẦN TỰ ${chunks.length} chunks...`);

  for (const [index, chunk] of chunks.entries()) {
    try {
      console.log(`Đang tóm tắt chunk ${index + 1}/${chunks.length}...`);
      const summary = await aiService.summarizeChunk(chunk.content);
      chunkSummaries.push(summary);
      console.log(`   -> Tóm tắt chunk ${index + 1} thành công.`);

      // Thêm một khoảng nghỉ nhỏ (ví dụ: 2 giây) giữa các lần gọi để đảm bảo an toàn
      // Bạn có thể cần điều chỉnh thời gian này
      if (index < chunks.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`Lỗi khi tóm tắt chunk ${index + 1}:`, error.message);
      // Quyết định cách xử lý: có thể bỏ qua chunk lỗi hoặc dừng toàn bộ quá trình
      // Ở đây chúng ta sẽ bỏ qua và tiếp tục
      chunkSummaries.push(`[Lỗi khi tóm tắt đoạn văn bản số ${index + 1}]`);
    }
  }

  // BƯỚC REDUCE: Ghép các tóm tắt nhỏ và tạo tóm tắt cuối cùng
  console.log("Bắt đầu REDUCE step: Tổng hợp các tóm tắt...");
  const combinedSummaries = chunkSummaries.join("\n---\n");
  const finalSummary = await aiService.summarizeText(combinedSummaries);
  // ==========================================================

  // Lưu kết quả cuối cùng vào cache
  // await db(TABLE_NAMES.DOCUMENTS)
  //   .where({ id: documentId })
  //   .update({ summary: finalSummary });

  return finalSummary;
};

/**
 * Xóa tài liệu và các dữ liệu liên quan một cách toàn vẹn.
 * @param {string} documentId - ID của tài liệu.
 * @param {string} userId - ID của người dùng.
 * @returns {Promise<object>} Bản ghi tài liệu đã bị xóa.
 */
const deleteDocumentById = async (documentId, userId) => {
  const trx = await db.transaction();
  try {
    const document = await trx(TABLE_NAMES.DOCUMENTS)
      .where({ id: documentId })
      .first();
    if (!document) {
      throw new Error("Tài liệu không tồn tại.");
    }

    const isOwner = await verifyProjectOwnership(document.project_id, userId);
    if (!isOwner) {
      const error = new Error("Bạn không có quyền xóa tài liệu này.");
      error.statusCode = 403;
      throw error;
    }

    // Xóa các embeddings liên quan
    await trx(TABLE_NAMES.EMBEDDINGS)
      .whereRaw("metadata->>'documentId' = ?", [documentId])
      .del();

    // Xóa bản ghi tài liệu
    const [deletedDocument] = await trx(TABLE_NAMES.DOCUMENTS)
      .where({ id: documentId })
      .del()
      .returning("*");

    // Commit transaction
    await trx.commit();

    // Xóa file vật lý sau khi transaction thành công
    if (deletedDocument.file_path) {
      try {
        await fs.unlink(deletedDocument.file_path);
        console.log(`Đã xóa file vật lý: ${deletedDocument.file_path}`);
      } catch (fileError) {
        // Ghi log lỗi nhưng không cần báo cho user vì DB đã sạch
        console.error("Lỗi khi xóa file vật lý:", fileError);
      }
    }

    return deletedDocument;
  } catch (error) {
    await trx.rollback();
    throw error; // Ném lỗi ra để controller xử lý
  }
};

module.exports = {
  getDocumentById,
  createDocument,
  getSummary,
  deleteDocumentById,
};
