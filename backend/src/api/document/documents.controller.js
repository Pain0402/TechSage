const db = require("../../config/db");
const { processAndEmbedDocument } = require("../../services/rag.service");
const { TABLE_NAMES } = require("../../config/constants");

exports.uploadDocument = async (req, res) => {
  if (!req.file) {
    return res.status(400).send("Vui lòng chọn một file để upload.");
  }
  const { projectId } = req.body;
  if (!projectId) {
    return res.status(400).send("Cần có ID của dự án.");
  }
  try {
    const [document] = await db(TABLE_NAMES.DOCUMENTS)
      .insert({
        project_id: projectId,
        file_name: req.file.originalname,
        file_type: req.file.mimetype,
        status: "processing",
      })
      .returning("*");

    processAndEmbedDocument(
      req.file.path,
      document.id,
      projectId,
      req.file.mimetype
    );

    res.status(201).json({
      message: "File đã được tải lên và đang được xử lý.",
      document: document,
    });
  } catch (error) {
    console.error("Lỗi upload file:", error);
    res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
};
