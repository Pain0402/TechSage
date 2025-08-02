const { validationResult } = require("express-validator");
const projectService = require("../services/projects.service");

// Helper để xử lý lỗi nhất quán
const handleServiceError = (res, error) => {
  console.error(error);
  const statusCode = error.statusCode || 500;
  res
    .status(statusCode)
    .json({ message: error.message || "Lỗi máy chủ nội bộ." });
};

exports.createProject = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const newProject = await projectService.createProjectForUser(
      req.body,
      req.user.userId
    );
    res.status(201).json(newProject);
  } catch (error) {
    handleServiceError(res, error);
  }
};

exports.getProjectsForUser = async (req, res) => {
  try {
    const projects = await projectService.findProjectsByUser(req.user.userId);
    res.status(200).json(projects);
  } catch (error) {
    handleServiceError(res, error);
  }
};

exports.getProjectDetail = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const project = await projectService.findProjectDetails(
      req.params.projectId,
      req.user.userId
    );
    res.status(200).json(project);
  } catch (error) {
    handleServiceError(res, error);
  }
};

exports.getDocumentsForProject = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const documents = await projectService.findDocumentsInProject(
      req.params.projectId,
      req.user.userId
    );
    res.status(200).json(documents);
  } catch (error) {
    handleServiceError(res, error);
  }
};

exports.queryProject = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { projectId, question } = req.body;
    const answer = await projectService.performQueryOnProject(
      projectId,
      question,
      req.user.userId
    );
    res.status(200).json({ answer });
  } catch (error) {
    handleServiceError(res, error);
  }
};

exports.deleteProject = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    await projectService.deleteProjectAndData(
      req.params.projectId,
      req.user.userId
    );
    res.status(204).send(); // 204 No Content là phù hợp cho việc xóa thành công
  } catch (error) {
    handleServiceError(res, error);
  }
};

exports.generateQuiz = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const quizData = await projectService.createQuizFromDocuments(
      req.body,
      req.user.userId
    );
    res.status(200).json(quizData);
  } catch (error) {
    handleServiceError(res, error);
  }
};
