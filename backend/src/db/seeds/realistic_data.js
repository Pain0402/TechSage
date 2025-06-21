const bcrypt = require("bcryptjs");

exports.seed = async function (knex) {
  // Xoá dữ liệu cũ
  await knex("documents").del();
  await knex("projects").del();
  await knex("users").del();

  // 1. Danh sách người dùng
  const rawUsers = [
    { email: "alice@techsage.dev", password: "alicepass" },
    { email: "bob@techsage.dev", password: "bobpass" },
    { email: "carol@techsage.dev", password: "carolpass" },
    { email: "david@techsage.dev", password: "davidpass" },
    { email: "eve@techsage.dev", password: "evepass" },
  ];

  // Hash mật khẩu và chèn user
  const users = [];
  for (const u of rawUsers) {
    const password_hash = await bcrypt.hash(u.password, 10);
    const [user] = await knex("users")
      .insert({ email: u.email, password_hash })
      .returning("*");
    users.push(user);
  }

  // 2. Projects
  const projects = [];

  const rawProjects = [
    {
      userIndex: 0,
      name: "AI Research Notes",
      description: "Ghi chú về NLP và LLM.",
    },
    {
      userIndex: 1,
      name: "DevOps Handbook",
      description: "Tài liệu nội bộ về CI/CD.",
    },
    {
      userIndex: 1,
      name: "Monitoring System",
      description: "Phân tích log & metrics.",
    },
    {
      userIndex: 2,
      name: "Frontend Architecture",
      description: "Tối ưu React & Tailwind.",
    },
    {
      userIndex: 3,
      name: "Database Design",
      description: "Tối ưu hoá truy vấn PostgreSQL.",
    },
    {
      userIndex: 4,
      name: "RAG-based Chatbot",
      description: "Tài liệu xây dựng chatbot tài liệu.",
    },
  ];

  for (const p of rawProjects) {
    const [project] = await knex("projects")
      .insert({
        user_id: users[p.userIndex].id,
        name: p.name,
        description: p.description,
      })
      .returning("*");
    projects.push(project);
  }

  // 3. Documents
  const documentsData = [
    { projectIndex: 0, file_name: "llm_paper.pdf", file_type: "pdf" },
    { projectIndex: 1, file_name: "cicd_guide.md", file_type: "md" },
    { projectIndex: 2, file_name: "logs.txt", file_type: "txt" },
    {
      projectIndex: 4,
      file_name: "postgresql_best_practices.pdf",
      file_type: "pdf",
    },
    {
      projectIndex: 5,
      file_name: "chatbot_architecture.pdf",
      file_type: "pdf",
    },
    { projectIndex: 5, file_name: "embedding_strategy.txt", file_type: "txt" },
  ];

  for (const doc of documentsData) {
    await knex("documents").insert({
      project_id: projects[doc.projectIndex].id,
      file_name: doc.file_name,
      file_type: doc.file_type,
      status: "ready",
    });
  }

  console.log("✅ Dữ liệu thực tế đã được tạo thành công.");
};
