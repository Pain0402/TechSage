const { TABLE_NAMES, VECTOR_DIMENSIONS } = require("../../config/constants");

exports.up = async function (knex) {
  await knex.raw("CREATE EXTENSION IF NOT EXISTS vector");

  await knex.schema.createTable(TABLE_NAMES.USERS, function (table) {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.string("email", 255).notNullable().unique();
    table.string("password_hash", 255).notNullable();
    table.timestamps(true, true);
  });

  await knex.schema.createTable(TABLE_NAMES.PROJECTS, function (table) {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("user_id")
      .references("id")
      .inTable(TABLE_NAMES.USERS)
      .onDelete("CASCADE");
    table.string("name", 255).notNullable();
    table.text("description");
    table.timestamps(true, true);
  });

  await knex.schema.createTable(TABLE_NAMES.DOCUMENTS, function (table) {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("project_id")
      .references("id")
      .inTable(TABLE_NAMES.PROJECTS)
      .onDelete("CASCADE");
    table.string("file_name", 255).notNullable();
    table.string("file_type", 50);
    table.string("status", 50).defaultTo("uploaded");
    table.timestamps(true, true);
  });

  await knex.schema.createTable(TABLE_NAMES.EMBEDDINGS, function (table) {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.text("content").notNullable();
    table.jsonb("metadata");
    table.specificType("embedding", `vector(${VECTOR_DIMENSIONS})`);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists(TABLE_NAMES.EMBEDDINGS);
  await knex.schema.dropTableIfExists(TABLE_NAMES.DOCUMENTS);
  await knex.schema.dropTableIfExists(TABLE_NAMES.PROJECTS);
  await knex.schema.dropTableIfExists(TABLE_NAMES.USERS);
};
