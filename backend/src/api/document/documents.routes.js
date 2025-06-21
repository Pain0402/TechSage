const express = require("express");
const router = express.Router();
const multer = require("multer");
const documentsController = require("./documents.controller");

const upload = multer({ dest: "uploads/" });
router.post(
  "/upload",
  upload.single("documentFile"),
  documentsController.uploadDocument
);

module.exports = router;
