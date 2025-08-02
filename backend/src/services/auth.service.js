const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/**
 * Tìm kiếm người dùng trong cơ sở dữ liệu bằng email.
 * @param {string} email - Email của người dùng.
 * @returns {Promise<object|null>} Đối tượng người dùng hoặc null nếu không tìm thấy.
 */
const findUserByEmail = (email) => {
  return db("users").where({ email }).first();
};

/**
 * Tạo một người dùng mới và lưu vào cơ sở dữ liệu.
 * @param {object} userData - Dữ liệu người dùng.
 * @param {string} userData.email - Email.
 * @param {string} userData.password - Mật khẩu thô.
 * @returns {Promise<object>} Đối tượng người dùng mới (chỉ gồm id và email).
 */
const createUser = async ({ email, password }) => {
  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(password, salt);

  const [newUser] = await db("users")
    .insert({ email, password_hash })
    .returning(["id", "email"]);

  return newUser;
};

/**
 * So sánh mật khẩu người dùng cung cấp với hash trong DB.
 * @param {string} password - Mật khẩu thô.
 * @param {string} hash - Chuỗi hash mật khẩu từ DB.
 * @returns {Promise<boolean>} True nếu mật khẩu hợp lệ.
 */
const validatePassword = (password, hash) => {
  return bcrypt.compare(password, hash);
};

/**
 * Tạo một JSON Web Token (JWT) cho người dùng.
 * @param {object} user - Đối tượng người dùng.
 * @param {string} user.id - ID người dùng.
 * @param {string} user.email - Email người dùng.
 * @returns {string} Chuỗi JWT.
 */
const generateToken = (user) => {
  return jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
  );
};

module.exports = {
  findUserByEmail,
  createUser,
  validatePassword,
  generateToken,
};
