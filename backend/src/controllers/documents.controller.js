const { validationResult } = require("express-validator");
const documentService = require("../services/document.service");

exports.uploadDocument = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  if (!req.file) {
    return res
      .status(400)
      .json({ message: "Vui lòng chọn một file để upload." });
  }

  const { projectId } = req.body;
  const userId = req.user.userId; // Lấy userId từ token đã được giải mã bởi middleware 'protect'

  try {
    const document = await documentService.createDocument(
      req.file,
      projectId,
      userId
    );
    res.status(202).json({
      // 202 Accepted: Yêu cầu đã được chấp nhận để xử lý
      message: "File đã được tải lên và đang được xử lý trong nền.",
      document: document,
    });
  } catch (error) {
    console.error("Lỗi upload file:", error);
    // Trả về đúng mã lỗi do service định nghĩa (ví dụ: 403 Forbidden)
    const statusCode = error.statusCode || 500;
    res
      .status(statusCode)
      .json({ message: error.message || "Lỗi máy chủ nội bộ" });
  }
};

exports.summarizeDocument = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { documentId } = req.params;
  const userId = req.user.userId;

  try {
    const summary = await documentService.getSummary(documentId, userId);
    res.status(200).json({ summary });
  } catch (error) {
    console.error("Lỗi khi tóm tắt tài liệu:", error);
    const statusCode = error.statusCode || 500;
    res
      .status(statusCode)
      .json({ message: error.message || "Lỗi máy chủ nội bộ" });
  }
};

exports.deleteDocument = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { documentId } = req.params;
  const userId = req.user.userId;

  try {
    const deletedDocument = await documentService.deleteDocumentById(
      documentId,
      userId
    );
    if (!deletedDocument) {
      return res.status(404).json({ message: "Tài liệu không tồn tại." });
    }
    res.status(200).json({
      message: "Tài liệu đã được xóa thành công.",
      document: deletedDocument,
    });
  } catch (error) {
    console.error("Lỗi khi xóa tài liệu:", error);
    const statusCode = error.statusCode || 500;
    res
      .status(statusCode)
      .json({ message: error.message || "Lỗi máy chủ nội bộ" });
  }
};

exports.getDocumentById = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { documentId } = req.params;
  const userId = req.user.userId;

  try {
    const document = await documentService.getDocumentById(documentId, userId);
    res.status(200).json(document);
  } catch (error) {
    console.error("Lỗi khi lấy thông tin tài liệu:", error);
    const statusCode = error.statusCode || 500;
    res
      .status(statusCode)
      .json({ message: error.message || "Lỗi máy chủ nội bộ" });
  }
};
