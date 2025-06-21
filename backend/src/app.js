require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./api/auth/auth.routes");
const projectRoutes = require("./api/projects/projects.routes");
const documentRoutes = require("./api/document/documents.routes");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/documents", documentRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server đang chạy trên cổng ${PORT}`);
});
