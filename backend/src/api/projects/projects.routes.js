const express = require("express");
const router = express.Router();
const projectsController = require("./projects.controller");

router.post("/", projectsController.createProject); // Route để tạo project mới
router.post("/:projectId/query", projectsController.queryProject); // Route để query

module.exports = router;
