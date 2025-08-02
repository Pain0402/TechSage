const express = require("express");
const router = express.Router();
const { check, body } = require("express-validator");
const projectsController = require("../controllers/projects.controller");
const { protect } = require("../middleware/auth.middleware");

// GET /api/projects - Lấy tất cả dự án của người dùng
router.get("/", protect, projectsController.getProjectsForUser);

// POST /api/projects - Tạo một dự án mới
router.post(
  "/",
  protect, // *** BẢO VỆ ROUTE ***
  [
    body("name", "Tên dự án không được để trống.")
      .not()
      .isEmpty()
      .trim()
      .escape(),
    body("description", "Mô tả có thể để trống.").optional().trim().escape(),
  ],
  projectsController.createProject
);

// GET /api/projects/:projectId - Lấy chi tiết một dự án
router.get(
  "/:projectId",
  protect,
  [check("projectId", "ID dự án không hợp lệ.").isUUID()],
  projectsController.getProjectDetail
);

// DELETE /api/projects/:projectId - Xóa một dự án
router.delete(
  "/:projectId",
  protect,
  [check("projectId", "ID dự án không hợp lệ.").isUUID()],
  projectsController.deleteProject
);

// GET /api/projects/:projectId/documents - Lấy tài liệu của một dự án
router.get(
  "/:projectId/documents",
  protect,
  [check("projectId", "ID dự án không hợp lệ.").isUUID()],
  projectsController.getDocumentsForProject
);

// POST /api/projects/query - Hỏi đáp với một dự án
router.post(
  "/query", // Thay đổi route để không bị xung đột
  protect, // *** BẢO VỆ ROUTE ***
  [
    body("projectId", "ID dự án không hợp lệ.").isUUID(),
    body("question", "Câu hỏi không được để trống.").not().isEmpty().trim(),
  ],
  projectsController.queryProject
);

// POST /api/projects/generate-quiz - Tạo quiz từ các tài liệu
router.post(
  "/generate-quiz",
  protect,
  [
    body("documentIds", "Cần cung cấp một mảng ID tài liệu.").isArray({
      min: 1,
    }),
    body("documentIds.*", "ID tài liệu không hợp lệ.").isUUID(),
  ],
  projectsController.generateQuiz
);

module.exports = router;
