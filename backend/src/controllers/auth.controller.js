const { validationResult } = require("express-validator");
const authService = require("../services/auth.service");

/**
 * Controller xử lý việc đăng ký người dùng.
 */
exports.register = async (req, res) => {
  // 1. Kiểm tra lỗi validation từ express-validator
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // 2. Kiểm tra xem email đã tồn tại chưa (gọi service)
    const existingUser = await authService.findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: "Email đã tồn tại." });
    }

    // 3. Tạo người dùng mới (gọi service)
    const newUser = await authService.createUser({ email, password });

    // 4. Phản hồi thành công
    res.status(201).json({
      message: "Tạo tài khoản thành công!",
      user: newUser,
    });
  } catch (error) {
    console.error("Lỗi đăng ký:", error);
    res.status(500).json({ message: "Lỗi máy chủ nội bộ." });
  }
};

/**
 * Controller xử lý việc đăng nhập.
 */
exports.login = async (req, res) => {
  // 1. Kiểm tra lỗi validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // 2. Tìm người dùng bằng email (gọi service)
    const user = await authService.findUserByEmail(email);
    if (!user) {
      return res
        .status(401)
        .json({ message: "Email hoặc mật khẩu không chính xác." });
    }

    // 3. So sánh mật khẩu (gọi service)
    const isValidPassword = await authService.validatePassword(
      password,
      user.password_hash
    );
    if (!isValidPassword) {
      return res
        .status(401)
        .json({ message: "Email hoặc mật khẩu không chính xác." });
    }

    // 4. Tạo token (gọi service)
    const token = authService.generateToken(user);

    // 5. Phản hồi thành công
    res.status(200).json({
      message: "Đăng nhập thành công!",
      token,
      user: { id: user.id, email: user.email },
    });
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    res.status(500).json({ message: "Lỗi máy chủ nội bộ." });
  }
};
