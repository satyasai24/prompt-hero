import { GoogleGenerativeAI } from '@google/generative-ai';

// Access your API key as an environment variable
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export const testGoogleGeminiPrompt = async (promptText) => {
  try {
    // For text-only input, use the gemini-pro model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(promptText);
    const response = result.response;
    const text = response.text();
    return text;
  } catch (error) {
    console.error("Google Gemini API Error:", error.response ? error.response.data : error.message);
    throw new Error("Failed to get response from Google Gemini.");
  }
};
