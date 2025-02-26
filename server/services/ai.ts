import 'dotenv/config';

if (!process.env.GOOGLE_AI_API_KEY) {
  throw new Error("GOOGLE_AI_API_KEY is required");
}

// List of sensitive topics to filter out
const SENSITIVE_TOPICS = [
  // Religious terms
  'god', 'jesus', 'church', 'mosque', 'temple', 'pray', 'religion', 'bible', 'quran', 'torah',
  // Political terms
  'president', 'election', 'politics', 'democrat', 'republican', 'congress', 'government', 'political',
  'vote', 'campaign'
];

function containsSensitiveContent(text: string): boolean {
  const normalizedText = text.toLowerCase();
  return SENSITIVE_TOPICS.some(topic => 
    normalizedText.includes(topic.toLowerCase()) ||
    normalizedText.split(/\s+/).some(word => 
      topic.toLowerCase() === word.toLowerCase()
    )
  );
}

export async function generateStory(topic: string): Promise<{content: string, words: string[]}> {
  // Validate topic first
  if (containsSensitiveContent(topic)) {
    throw new Error("Sorry, this topic contains sensitive content. Please try a different topic.");
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`;

  const prompt = {
    contents: [{
      parts: [{
        text: `Write a very short, simple story (2-3 sentences) about ${topic} for a young child learning to read. 
        Use simple words and basic sentence structure.
        The story should be engaging but easy to understand.
        Do not include any religious, political, or controversial content.
        Keep the content appropriate for young children.`
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

    // Double check the generated content
    if (containsSensitiveContent(content)) {
      throw new Error("Generated content contains sensitive topics. Please try again with a different topic.");
    }

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