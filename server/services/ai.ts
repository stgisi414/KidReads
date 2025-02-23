import 'dotenv/config';

if (!process.env.GOOGLE_AI_API_KEY) {
  throw new Error("GOOGLE_AI_API_KEY is required");
}

export async function generateStory(topic: string): Promise<{content: string, words: string[]}> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`;

  const prompt = {
    contents: [{
      parts: [{
        text: `Write a very short, simple story (2-3 sentences) about ${topic} for a young child learning to read. 
        Use simple words and basic sentence structure.
        The story should be engaging but easy to understand.`
      }]
    }]
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(prompt)
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.candidates[0].content.parts[0].text.trim();

    // Split into words, keeping punctuation attached to words
    const words = content.match(/[\w']+(?:[.,!?])?/g) || [];

    console.log('Generated story content:', { content, wordCount: words.length });

    return {
      content,
      words
    };
  } catch (error) {
    console.error('Error generating story:', error);
    throw error;
  }
}