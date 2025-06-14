/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .createTable("users", function (table) {
      table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
      table.string("email", 255).notNullable().unique();
      table.string("password_hash", 255).notNullable();
      table.timestamps(true, true);
    })
    .createTable("projects", function (table) {
      table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
      table
        .uuid("user_id")
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
      table.string("name", 255).notNullable();
      table.text("description");
      table.timestamps(true, true);
    })
    .createTable("documents", function (table) {
      table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
      table
        .uuid("project_id")
        .references("id")
        .inTable("projects")
        .onDelete("CASCADE");
      table.string("file_name", 255).notNullable();
      table.string("file_type", 50);
      table.string("status", 50).defaultTo("uploaded");
      table.timestamps(true, true);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists("documents")
    .dropTableIfExists("projects")
    .dropTableIfExists("users");
};
