const bcrypt = require("bcryptjs");
const { TABLE_NAMES } = require("../../config/constants");

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  // Xoá dữ liệu cũ theo thứ tự ngược lại để tránh lỗi khóa ngoại
  await knex(TABLE_NAMES.DOCUMENTS).del();
  await knex(TABLE_NAMES.PROJECTS).del();
  await knex(TABLE_NAMES.USERS).del();

  // === 1. TẠO NGƯỜI DÙNG ===
  const rawUsers = [
    { email: "alice@techsage.dev", password: "alicepassword" },
    { email: "bob@techsage.dev", password: "bobpassword" },
    { email: "carol@techsage.dev", password: "carolpassword" },
  ];

  const usersToInsert = await Promise.all(
    rawUsers.map(async (u) => ({
      email: u.email,
      password_hash: await bcrypt.hash(u.password, 10),
    }))
  );

  // *** TỐI ƯU: Sử dụng bulk insert
  const users = await knex(TABLE_NAMES.USERS)
    .insert(usersToInsert)
    .returning("*");
  console.log(`Đã tạo ${users.length} người dùng.`);

  // === 2. TẠO DỰ ÁN ===
  const projectsToInsert = [
    {
      user_id: users[0].id,
      name: "Nghiên cứu AI",
      description: "Ghi chú về NLP và các mô hình LLM.",
    },
    {
      user_id: users[1].id,
      name: "Sổ tay DevOps",
      description: "Tài liệu nội bộ về CI/CD và Kubernetes.",
    },
    {
      user_id: users[1].id,
      name: "Hệ thống giám sát",
      description: "Phân tích log và metrics từ Prometheus.",
    },
    {
      user_id: users[2].id,
      name: "Kiến trúc Frontend",
      description: "Tối ưu hiệu năng React và Vue.",
    },
  ];

  const projects = await knex(TABLE_NAMES.PROJECTS)
    .insert(projectsToInsert)
    .returning("*");
  console.log(`Đã tạo ${projects.length} dự án.`);

  // === 3. TẠO TÀI LIỆU ===
  const documentsToInsert = [
    {
      project_id: projects[0].id,
      file_name: "attention_is_all_you_need.pdf",
      file_path: "uploads/attention_is_all_you_need.pdf",
      file_type: "application/pdf",
      status: "completed",
    },
    {
      project_id: projects[1].id,
      file_name: "docker_cheatsheet.md",
      file_path: "uploads/docker_cheatsheet.md",
      file_type: "text/markdown",
      status: "completed",
    },
    {
      project_id: projects[2].id,
      file_name: "api_gateway_logs.txt",
      file_path: "uploads/api_gateway_logs.txt",
      file_type: "text/plain",
      status: "completed",
    },
    {
      project_id: projects[3].id,
      file_name: "virtual_dom_explained.pdf",
      file_path: "uploads/virtual_dom_explained.pdf",
      file_type: "application/pdf",
      status: "completed",
    },
  ];

  const documents = await knex(TABLE_NAMES.DOCUMENTS)
    .insert(documentsToInsert)
    .returning("*");
  console.log(`Đã tạo ${documents.length} tài liệu.`);

  console.log("✅ Dữ liệu thực tế đã được tạo thành công.");
};
