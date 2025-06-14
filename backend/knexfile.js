// backend/knexfile.js
require("dotenv").config(); // Đảm bảo dòng này ở trên cùng

module.exports = {
  development: {
    client: "pg",
    connection: process.env.DATABASE_URL,
    migrations: {
      directory: "./src/db/migrations",
    },
    seeds: {
      directory: "./src/db/seeds",
    },
  },
};
