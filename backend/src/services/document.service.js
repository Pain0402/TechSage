const fs = require("fs/promises");
const db = require("../config/db");
const { processAndEmbedDocument } = require("./rag.service");
const { TABLE_NAMES } = require("../config/constants");
const aiService = require("./ai.service");

/**
 * Xác minh một dự án có thuộc sở hữu của người dùng đã xác thực hay không.
 * @param {string} projectId - ID của dự án.
 * @param {string} userId - ID của người dùng.
 * @returns {Promise<boolean>} - Trả về true nếu người dùng là chủ sở hữu.
 */
const verifyProjectOwnership = async (projectId, userId) => {
  const project = await db(TABLE_NAMES.PROJECTS)
    .where({ id: projectId, user_id: userId })
    .first();
  return !!project;
};

/**
 * Lấy thông tin chi tiết của một tài liệu, đồng thời kiểm tra quyền sở hữu.
 * @param {string} documentId - ID của tài liệu.
 * @param {string} userId - ID của người dùng yêu cầu.
 * @returns {Promise<object>} - Đối tượng tài liệu.
 * @throws {Error} Nếu tài liệu không tồn tại hoặc người dùng không có quyền truy cập.
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

  const isOwner = await verifyProjectOwnership(document.project_id, userId);
  if (!isOwner) {
    const error = new Error("Bạn không có quyền truy cập tài liệu này.");
    error.statusCode = 403; // Forbidden
    throw error;
  }

  return document;
};

/**
 * Xử lý việc tải lên và embedding tài liệu ở chế độ nền.
 * Cập nhật trạng thái và dọn dẹp file tạm sau khi hoàn tất.
 * @param {object} file - Đối tượng file từ multer.
 * @param {string} documentId - ID của bản ghi tài liệu trong DB.
 * @param {string} projectId - ID của dự án.
 */
const handleBackgroundProcessing = async (file, documentId, projectId) => {
  try {
    await processAndEmbedDocument(
      file.path,
      documentId,
      projectId,
      file.mimetype
    );

    await db(TABLE_NAMES.DOCUMENTS)
      .where({ id: documentId })
      .update({ status: "completed" });
    console.log(`Xử lý thành công tài liệu: ${documentId}`);
  } catch (error) {
    console.error(`Lỗi xử lý nền cho tài liệu ${documentId}:`, error);
    await db(TABLE_NAMES.DOCUMENTS)
      .where({ id: documentId })
      .update({ status: "failed" });
  } finally {
    // Luôn dọn dẹp file tạm dù thành công hay thất bại.
    try {
      await fs.unlink(file.path);
      console.log(`Đã xóa file tạm: ${file.path}`);
    } catch (cleanupError) {
      console.error(`Lỗi khi dọn dẹp file tạm ${file.path}:`, cleanupError);
    }
  }
};

/**
 * Tạo một bản ghi tài liệu mới và khởi chạy quá trình xử lý nền.
 * @param {object} file - Đối tượng file từ multer.
 * @param {string} projectId - ID của dự án.
 * @param {string} userId - ID của người dùng.
 * @returns {Promise<object>} Bản ghi tài liệu vừa được tạo.
 */
const createDocument = async (file, projectId, userId) => {
  const isOwner = await verifyProjectOwnership(projectId, userId);
  if (!isOwner) {
    const error = new Error("Bạn không có quyền thêm tài liệu vào dự án này.");
    error.statusCode = 403;
    throw error;
  }

  const [document] = await db(TABLE_NAMES.DOCUMENTS)
    .insert({
      project_id: projectId,
      file_name: file.originalname,
      file_path: file.path,
      file_type: file.mimetype,
      status: "processing",
    })
    .returning("*");

  // Kích hoạt xử lý nền (không await để trả về response ngay lập tức).
  handleBackgroundProcessing(file, document.id, projectId);

  return document;
};

/**
 * Tạo và trả về bản tóm tắt cho một tài liệu sử dụng phương pháp Map-Reduce.
 * @param {string} documentId - ID của tài liệu.
 * @param {string} userId - ID của người dùng.
 * @returns {Promise<string>} Chuỗi tóm tắt.
 */
const getSummary = async (documentId, userId) => {
  // Kiểm tra quyền sở hữu và lấy thông tin tài liệu.
  const document = await getDocumentById(documentId, userId);

  // Nếu đã có tóm tắt, trả về từ cache.
  if (document.summary) {
    return document.summary;
  }

  const chunks = await db(TABLE_NAMES.EMBEDDINGS)
    .whereRaw("metadata->>'documentId' = ?", [documentId])
    .select("content");

  if (chunks.length === 0) {
    const error = new Error(
      "Không tìm thấy nội dung cho tài liệu này để tóm tắt."
    );
    error.statusCode = 404;
    throw error;
  }

  // BƯỚC MAP: Tóm tắt từng chunk.
  const chunkSummaries = [];
  console.log(`Bắt đầu Map-Reduce: Tóm tắt tuần tự ${chunks.length} chunks...`);

  for (const [index, chunk] of chunks.entries()) {
    try {
      console.log(`Đang tóm tắt chunk ${index + 1}/${chunks.length}...`);
      const summary = await aiService.summarizeChunk(chunk.content);
      chunkSummaries.push(summary);

      // Thêm khoảng nghỉ ngắn giữa các lần gọi API để tránh rate-limiting.
      if (index < chunks.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`Lỗi khi tóm tắt chunk ${index + 1}:`, error.message);
      // Bỏ qua chunk lỗi và tiếp tục.
      chunkSummaries.push(`[Lỗi khi tóm tắt đoạn văn bản số ${index + 1}]`);
    }
  }

  // BƯỚC REDUCE: Ghép các tóm tắt nhỏ và tạo tóm tắt cuối cùng.
  console.log("Bắt đầu Reduce: Tổng hợp các tóm tắt...");
  const combinedSummaries = chunkSummaries.join("\n---\n");
  const finalSummary = await aiService.summarizeText(combinedSummaries);

  // Lưu kết quả cuối cùng vào cache để sử dụng trong tương lai.
  // await db(TABLE_NAMES.DOCUMENTS)
  //   .where({ id: documentId })
  //   .update({ summary: finalSummary });

  return finalSummary;
};

/**
 * Xóa tài liệu và tất cả dữ liệu liên quan (embeddings, file vật lý).
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

    // Xóa các embeddings liên quan trong transaction.
    await trx(TABLE_NAMES.EMBEDDINGS)
      .whereRaw("metadata->>'documentId' = ?", [documentId])
      .del();

    // Xóa bản ghi tài liệu trong transaction.
    const [deletedDocument] = await trx(TABLE_NAMES.DOCUMENTS)
      .where({ id: documentId })
      .del()
      .returning("*");

    await trx.commit();

    // Xóa file vật lý sau khi transaction thành công.
    if (deletedDocument.file_path) {
      try {
        await fs.unlink(deletedDocument.file_path);
        console.log(`Đã xóa file vật lý: ${deletedDocument.file_path}`);
      } catch (fileError) {
        console.error(
          "Lỗi khi xóa file vật lý (DB đã được dọn dẹp):",
          fileError
        );
      }
    }

    return deletedDocument;
  } catch (error) {
    await trx.rollback();
    throw error;
  }
};

module.exports = {
  getDocumentById,
  createDocument,
  getSummary,
  deleteDocumentById,
};
