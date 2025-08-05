const express = require("express");
const router = express.Router();
const multer = require("multer");
const { check } = require("express-validator");
const documentsController = require("../controllers/documents.controller");
const { protect } = require("../middleware/auth.middleware"); // Sử dụng middleware đã tạo

// Cấu hình Multer để kiểm soát tốt hơn
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Đảm bảo thư mục 'uploads' đã tồn tại
  },
  filename: function (req, file, cb) {
    // Tạo tên file duy nhất để tránh ghi đè
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

/**
 * @route   POST /api/documents/upload
 * @desc    Tải lên một tài liệu mới cho một dự án
 * @access  Private
 */
router.post(
  "/upload",
  protect, // *** BẮT BUỘC: Bảo vệ route này
  upload.single("documentFile"), // Middleware của Multer xử lý file
  [
    // Validation
    check("projectId", "Cần có ID của dự án.").not().isEmpty().isUUID(),
  ],
  documentsController.uploadDocument
);

/**
 * @route   POST /api/documents/:documentId/summarize
 * @desc    Tạo tóm tắt cho một tài liệu
 * @access  Private
 */
router.post(
  "/:documentId/summarize",
  protect,
  [check("documentId", "ID tài liệu không hợp lệ.").isUUID()],
  documentsController.summarizeDocument
);

/**
 * @route   DELETE /api/documents/:documentId
 * @desc    Xóa một tài liệu
 * @access  Private
 */
router.delete(
  "/:documentId",
  protect,
  [check("documentId", "ID tài liệu không hợp lệ.").isUUID()],
  documentsController.deleteDocument
);

/**
 * @route   GET /api/documents/:documentId
 * @desc    Lấy thông tin chi tiết một tài liệu
 * @access  Private
 */
router.get(
  "/:documentId",
  protect,
  [check("documentId", "ID tài liệu không hợp lệ.").isUUID()],
  documentsController.getDocumentById
);

module.exports = router;
