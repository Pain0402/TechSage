const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");

// Khởi tạo LLM một lần duy nhất và tái sử dụng
const llm = new ChatGoogleGenerativeAI({
  model: process.env.GOOGLE_GEMINI_MODEL || "models/gemini-1.5-pro-latest",
  apiKey: process.env.GOOGLE_API_KEY,
});

/**
 * Tóm tắt một đoạn văn bản dài sử dụng LLM.
 * @param {string} textContent - Nội dung văn bản cần tóm tắt.
 * @returns {Promise<string>} - Chuỗi tóm tắt ở định dạng Markdown.
 */
const summarizeText = async (textContent) => {
  const template = `Dựa vào văn bản được cung cấp dưới đây, hãy viết một bản tóm tắt chi tiết, mạch lạc và súc tích, nêu bật được những ý chính và kết luận quan trọng. Luôn luôn trả lời bằng tiếng Việt và trình bày bằng định dạng Markdown cho dễ đọc.

--- VĂN BẢN GỐC ---
{document_text}
---

Bản tóm tắt của bạn:`;

  const prompt = template.replace("{document_text}", textContent);

  try {
    const result = await llm.invoke(prompt);
    return result.content;
  } catch (error) {
    console.error("Lỗi khi gọi AI để tóm tắt:", error);
    if (error.status === 429) {
      const retrySeconds = parseInt(
        error?.errorDetails?.find(
          (e) => e["@type"] === "type.googleapis.com/google.rpc.RetryInfo"
        )?.retryDelay || "30"
      );
      throw new Error(
        `⚠️ Quá số lượt sử dụng AI. Vui lòng thử lại sau khoảng ${retrySeconds} giây.`
      );
    }
    throw new Error("Không thể tạo tóm tắt vào lúc này.");
  }
};

module.exports = {
  summarizeText,
};
