const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const authController = require("../controllers/auth.controller");

/**
 * @route   POST /api/auth/register
 * @desc    Đăng ký người dùng mới
 * @access  Public
 */
router.post(
  "/register",
  [
    // Sử dụng express-validator để kiểm tra dữ liệu đầu vào
    check("email", "Vui lòng cung cấp một email hợp lệ.").isEmail(),
    check("password", "Mật khẩu phải có ít nhất 6 ký tự.").isLength({ min: 6 }),
  ],
  authController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Đăng nhập người dùng
 * @access  Public
 */
router.post(
  "/login",
  [
    // Validation cho route đăng nhập
    check("email", "Vui lòng cung cấp một email hợp lệ.").isEmail(),
    check("password", "Mật khẩu không được để trống.").not().isEmpty(),
  ],
  authController.login
);

module.exports = router;
