const fs = require("fs").promises;
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { Document } = require("@langchain/core/documents");
const pdfjs = require("pdfjs-dist/legacy/build/pdf.js");

// *** TỐI ƯU: Import service đã được tối ưu để lấy vector store ***
const { getVectorStore } = require("./vectorstore.service");

/**
 * Trích xuất nội dung văn bản từ một file PDF.
 * @param {string} filePath - Đường dẫn đến file PDF.
 * @returns {Promise<string>} - Nội dung văn bản của file.
 */
async function extractTextFromPdf(filePath) {
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

/**
 * Xử lý một file (đọc, chia nhỏ, nhúng) và thêm vào vector store.
 * Hàm này sẽ ném lỗi nếu có sự cố để service gọi nó có thể xử lý.
 * @param {string} filePath - Đường dẫn đến file.
 * @param {string} documentId - ID của tài liệu trong DB.
 * @param {string} projectId - ID của dự án chứa tài liệu.
 * @param {string} mimetype - Kiểu MIME của file.
 */
const processAndEmbedDocument = async (
  filePath,
  documentId,
  projectId,
  mimetype
) => {
  console.log(`Bắt đầu xử lý file: ${filePath} cho document ID: ${documentId}`);

  // Bước 1: Đọc và trích xuất nội dung file
  let pageContent;
  if (mimetype === "application/pdf") {
    console.log("Phát hiện file PDF, sử dụng trình đọc PDF chuyên dụng...");
    pageContent = await extractTextFromPdf(filePath);
  } else {
    console.log("Phát hiện file dạng text, đọc nội dung trực tiếp...");
    pageContent = await fs.readFile(filePath, "utf8");
  }

  // Bước 2: Chia nhỏ văn bản thành các chunks
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  const splitTexts = await splitter.splitText(pageContent);

  // Bước 3: Tạo các đối tượng Document của LangChain với metadata
  const splitDocs = splitTexts.map(
    (text) =>
      new Document({
        pageContent: text,
        metadata: { documentId: documentId, projectId: projectId },
      })
  );

  // Bước 4: Lấy instance đã được khởi tạo của vector store
  console.log("Lấy instance của PGVectorStore...");
  const pgvectorStore = await getVectorStore();

  // Bước 5: Thêm các documents đã xử lý vào vector store
  console.log(`Bắt đầu thêm ${splitDocs.length} chunks vào vector store...`);
  await pgvectorStore.addDocuments(splitDocs);

  // *** TỐI ƯU: Loại bỏ việc cập nhật trạng thái ở đây. ***
  // Service `document.service.js` sẽ chịu trách nhiệm cho việc này.

  console.log(`Xử lý và nhúng file thành công cho document ID: ${documentId}`);
};

module.exports = { processAndEmbedDocument };
