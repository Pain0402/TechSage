const { TABLE_NAMES, VECTOR_DIMENSIONS } = require("../../config/constants");

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // Bật extension cho kiểu dữ liệu vector
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'); // Hữu ích cho việc tạo UUID
  await knex.raw("CREATE EXTENSION IF NOT EXISTS vector");

  // Bảng người dùng
  await knex.schema.createTable(TABLE_NAMES.USERS, function (table) {
    table.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    table.string("email", 255).notNullable().unique(); // unique tự động tạo index
    table.string("password_hash", 255).notNullable();
    table.timestamps(true, true);
  });

  // Bảng dự án
  await knex.schema.createTable(TABLE_NAMES.PROJECTS, function (table) {
    table.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    table
      .uuid("user_id")
      .notNullable()
      .references("id")
      .inTable(TABLE_NAMES.USERS)
      .onDelete("CASCADE")
      .index(); // *** TỐI ƯU: Thêm index cho khóa ngoại
    table.string("name", 255).notNullable();
    table.text("description");
    table.timestamps(true, true);
  });

  // Bảng tài liệu
  await knex.schema.createTable(TABLE_NAMES.DOCUMENTS, function (table) {
    table.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    table
      .uuid("project_id")
      .notNullable()
      .references("id")
      .inTable(TABLE_NAMES.PROJECTS)
      .onDelete("CASCADE")
      .index(); // *** TỐI ƯU: Thêm index cho khóa ngoại
    table.string("file_name", 255).notNullable();
    table.string("file_path", 512); // *** SỬA LỖI: Thêm cột file_path
    table.string("file_type", 50);
    table.string("status", 50).defaultTo("uploaded");
    table.timestamps(true, true);
  });

  // Bảng embeddings
  await knex.schema.createTable(TABLE_NAMES.EMBEDDINGS, function (table) {
    table.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    table.text("content").notNullable();
    table.jsonb("metadata").index(); // Index metadata để lọc nhanh hơn
    table.specificType("embedding", `vector(${VECTOR_DIMENSIONS})`);
  });

  // *** TỐI ƯU QUAN TRỌNG: Tạo index cho vector để tìm kiếm nhanh
  // Sử dụng HNSW (Hierarchical Navigable Small World) cho sự cân bằng giữa tốc độ và độ chính xác
  await knex.raw(
    `CREATE INDEX ON ${TABLE_NAMES.EMBEDDINGS} USING hnsw (embedding vector_l2_ops)`
  );
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  // Xóa theo thứ tự ngược lại để tránh lỗi khóa ngoại
  await knex.schema.dropTableIfExists(TABLE_NAMES.EMBEDDINGS);
  await knex.schema.dropTableIfExists(TABLE_NAMES.DOCUMENTS);
  await knex.schema.dropTableIfExists(TABLE_NAMES.PROJECTS);
  await knex.schema.dropTableIfExists(TABLE_NAMES.USERS);
};
