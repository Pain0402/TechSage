require("dotenv").config();
const express = require("express");
const swaggerUi = require("swagger-ui-express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const projectRoutes = require("./routes/projects.routes");
const documentRoutes = require("./routes/documents.routes");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/documents", documentRoutes);

// Load OpenAPI spec from JSON file
const openApiSpec = JSON.parse(
  fs.readFileSync(path.join(__dirname, "docs", "openapiSpec.json"), "utf8")
);

// Serve Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🍃 Server running at http://localhost:${PORT}`);
  console.log(`🌿 Swagger docs at http://localhost:${PORT}/api-docs`);
});
