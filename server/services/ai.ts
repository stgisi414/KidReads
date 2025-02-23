import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GOOGLE_AI_API_KEY) {
  throw new Error("GOOGLE_AI_API_KEY is required");
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

export async function generateStory(topic: string): Promise<{content: string, words: string[]}> {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `Write a very short, simple story (2-3 sentences) about ${topic} for a young child learning to read. 
    Use simple words and basic sentence structure.
    The story should be engaging but easy to understand.`;

  const result = await model.generateContent(prompt);
  const content = result.response.text().trim();
  
  // Split into words, keeping punctuation attached to words
  const words = content.match(/[\w']+(?:[.,!?])?/g) || [];
  
  return {
    content,
    words
  };
}
