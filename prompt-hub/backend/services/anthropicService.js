import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const testAnthropicPrompt = async (promptText) => {
  try {
    const response = await anthropic.messages.create({
      model: "claude-2", // Or another preferred model like claude-3-opus-20240229 etc.
      max_tokens: 1024,
      messages: [{ role: "user", content: promptText }],
    });
    // Check if response.content is an array and has text
    if (response.content && Array.isArray(response.content) && response.content[0] && typeof response.content[0].text === 'string') {
         return response.content[0].text;
    } else if (typeof response.content === 'string') { // Older SDK versions might return string directly
         return response.content;
    }
    // If the structure is different, log it for debugging
    console.warn("Unexpected Anthropic response structure:", response);
    throw new Error("Unexpected response structure from Anthropic.");
  } catch (error) {
    console.error("Anthropic API Error:", error.response ? error.response.data : error.message);
    throw new Error("Failed to get response from Anthropic.");
  }
};
