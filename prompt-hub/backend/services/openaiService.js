import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const testOpenAIPrompt = async (promptText) => {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Or another preferred model
      messages: [{ role: "user", content: promptText }],
    });
    return completion.choices[0].message.content;
  } catch (error) {
    console.error("OpenAI API Error:", error.response ? error.response.data : error.message);
    throw new Error("Failed to get response from OpenAI.");
  }
};
