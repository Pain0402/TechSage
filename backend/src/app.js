require("dotenv").config({ path: "../.env" }); // Nạp biến môi trường
const express = require("express");
const cors = require("cors");

const authRoutes = require("./api/auth/auth.routes");

const app = express();

app.use(cors()); // Cho phép frontend gọi tới
app.use(express.json()); // Đọc được JSON body

app.get("/", (req, res) => {
  res.send("Chào mừng đến với API dự án!");
});

// Sử dụng routes xác thực
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server đang chạy trên cổng ${PORT}`);
});
