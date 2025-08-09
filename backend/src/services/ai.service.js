const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");

// Khởi tạo LLM một lần duy nhất và tái sử dụng
const llm = new ChatGoogleGenerativeAI({
  model: process.env.GOOGLE_GEMINI_MODEL || "models/gemini-1.5-flash-latest",
  apiKey: process.env.GOOGLE_API_KEY,
});

/**
 * Tóm tắt một đoạn văn bản (chunk) riêng lẻ.
 * @param {string} textContent - Nội dung của một chunk.
 * @returns {Promise<string>} - Chuỗi tóm tắt của chunk đó.
 */
const summarizeChunk = async (textContent) => {
  const template = `Tóm tắt lại đoạn văn bản sau một cách ngắn gọn, chỉ giữ lại những ý chính nhất.
--- VĂN BẢN GỐC ---
{document_text}
---
Bản tóm tắt ngắn gọn:`;

  const prompt = template.replace("{document_text}", textContent);
  const result = await llm.invoke(prompt);
  return result.content;
};

/**
 * Tổng hợp nhiều bản tóm tắt nhỏ thành một bản tóm tắt cuối cùng.
 * @param {string} textContent - Chuỗi chứa tất cả các bản tóm tắt nhỏ.
 * @returns {Promise<string>} - Chuỗi tóm tắt cuối cùng ở định dạng Markdown.
 */
const summarizeText = async (textContent) => {
  const template = `Dựa vào tập hợp các bản tóm tắt dưới đây, hãy viết một bản tóm tắt tổng hợp chi tiết, mạch lạc và súc tích, nêu bật được những ý chính và kết luận quan trọng. Luôn luôn trả lời bằng tiếng Việt và trình bày bằng định dạng Markdown cho dễ đọc.

--- CÁC BẢN TÓM TẮT ---
{document_text}
---

Bản tóm tắt tổng hợp của bạn:`;

  const prompt = template.replace("{document_text}", textContent);

  try {
    const result = await llm.invoke(prompt);
    return result.content;
  } catch (error) {
    console.error("Lỗi khi gọi AI để tóm tắt tổng hợp:", error);
    // Xử lý lỗi 429 vẫn giữ nguyên
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
    throw new Error("Không thể tạo tóm tắt tổng hợp vào lúc này.");
  }
};

module.exports = {
  summarizeText,
  summarizeChunk,
};
