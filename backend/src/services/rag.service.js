// src/services/rag.service.js - THE PERFECT FINAL VERSION
const fs = require("fs").promises;
const db = require("../config/db");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { GoogleGenerativeAIEmbeddings } = require("@langchain/google-genai");
const { PGVectorStore } = require("@langchain/community/vectorstores/pgvector");
const { TABLE_NAMES } = require("../config/constants");
const { Document } = require("@langchain/core/documents");
const pdfjs = require("pdfjs-dist/legacy/build/pdf.js");

async function extractTextFromPdf(filePath) {
  // const data = await fs.readFile(filePath);
  const data = new Uint8Array(await fs.readFile(filePath));
  const loadingTask = pdfjs.getDocument({ data });
  const pdf = await loadingTask.promise;
  let textContent = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const text = await page.getTextContent();
    textContent += text.items.map((item) => item.str).join(" ") + "\n";
  }
  return textContent;
}

// Sửa lại định nghĩa hàm để nhận 'mimetype'
const processAndEmbedDocument = async (
  filePath,
  documentId,
  projectId,
  mimetype
) => {
  console.log(`Bắt đầu xử lý file: ${filePath} cho document ID: ${documentId}`);
  try {
    let pageContent;

    // === THAY ĐỔI QUAN TRỌNG NHẤT ===
    // Dùng mimetype để nhận diện file thay vì đuôi file
    if (mimetype === "application/pdf") {
      console.log("Phát hiện file PDF, sử dụng trình đọc PDF chuyên dụng...");
      pageContent = await extractTextFromPdf(filePath);
    } else {
      console.log("Phát hiện file dạng text, đọc nội dung trực tiếp...");
      pageContent = await fs.readFile(filePath, "utf8");
    }

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const splitTexts = await splitter.splitText(pageContent);

    const splitDocs = splitTexts.map(
      (text) =>
        new Document({
          pageContent: text,
          metadata: { documentId: documentId, projectId: projectId },
        })
    );

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
    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GOOGLE_API_KEY,
    });
    const pgvectorStore = await PGVectorStore.initialize(embeddings, config);

    await pgvectorStore.addDocuments(splitDocs);

    await db(TABLE_NAMES.DOCUMENTS)
      .where({ id: documentId })
      .update({ status: "ready" });
    console.log(
      `Xử lý và nhúng file thành công cho document ID: ${documentId}`
    );
  } catch (error) {
    console.error("Lỗi trong quá trình RAG:", error);
    await db(TABLE_NAMES.DOCUMENTS)
      .where({ id: documentId })
      .update({ status: "failed" });
  }
};

module.exports = { processAndEmbedDocument };
