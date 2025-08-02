const { GoogleGenerativeAIEmbeddings } = require("@langchain/google-genai");
const { PGVectorStore } = require("@langchain/community/vectorstores/pgvector");
const db = require("../config/db");
const { TABLE_NAMES } = require("../config/constants");

let pgvectorStore;

/**
 * Khởi tạo PGVectorStore một lần duy nhất và tái sử dụng.
 * Đây là một hàm bất đồng bộ, cần được gọi khi ứng dụng khởi động.
 * @returns {Promise<PGVectorStore>}
 */
const getVectorStore = async () => {
  if (pgvectorStore) {
    return pgvectorStore;
  }

  console.log("Initializing PGVectorStore for the first time...");

  const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.GOOGLE_API_KEY,
  });

  const config = {
    postgresConnectionOptions: db.client.connectionSettings,
    tableName: TABLE_NAMES.EMBEDDINGS,
    columns: {
      idColumnName: "id",
      vectorColumnName: "embedding",
      contentColumnName: "content",
      metadataColumnName: "metadata",
    },
  };

  pgvectorStore = await PGVectorStore.initialize(embeddings, config);
  console.log("PGVectorStore initialized successfully.");
  return pgvectorStore;
};

// Gọi hàm khởi tạo ngay khi service được load
getVectorStore().catch((err) => {
  console.error("Failed to initialize Vector Store on startup:", err);
  process.exit(1); // Thoát ứng dụng nếu không kết nối được vector store
});

module.exports = { getVectorStore };
