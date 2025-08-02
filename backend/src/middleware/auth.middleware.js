const jwt = require("jsonwebtoken");

/**
 * Middleware để xác thực token JWT.
 * Kiểm tra header 'Authorization' để lấy token, giải mã và gắn thông tin người dùng vào request.
 * @param {object} req - Đối tượng request của Express.
 * @param {object} res - Đối tượng response của Express.
 * @param {function} next - Hàm callback để chuyển sang middleware tiếp theo.
 */
const protect = (req, res, next) => {
  let token;

  // Kiểm tra xem header 'Authorization' có tồn tại và bắt đầu bằng 'Bearer' không
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Tách lấy token từ header (Bearer <token>)
      token = req.headers.authorization.split(" ")[1];

      // Xác thực token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Gắn thông tin người dùng đã giải mã vào đối tượng request
      // để các controller sau có thể sử dụng
      req.user = decoded; // ví dụ: { userId: '...', email: '...' }

      next();
    } catch (error) {
      console.error("Lỗi xác thực token:", error);
      return res
        .status(401)
        .json({ message: "Xác thực thất bại, token không hợp lệ." });
    }
  }

  if (!token) {
    return res
      .status(401)
      .json({ message: "Xác thực thất bại, không tìm thấy token." });
  }
};

module.exports = { protect };
