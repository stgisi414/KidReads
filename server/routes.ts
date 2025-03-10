import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertStorySchema } from "@shared/schema";
import { generateStory, compareWords, smartWordGrouping, getPhonemesBreakdown } from "./services/ai";
import fal from "@fal-ai/serverless-client";
import { TextToSpeechClient } from '@google-cloud/text-to-speech';

// Define types for FAL API response
interface FalImage {
  url: string;
  width?: number;
  height?: number;
}

interface FalResponse {
  images?: FalImage[];
  [key: string]: any;
}

if (!process.env.FAL_AI_API_KEY) {
  throw new Error("FAL_AI_API_KEY is required");
}

fal.config({
  credentials: process.env.FAL_AI_API_KEY,
});

// Initialize the Google TTS client using the service account credentials file
const ttsClient = new TextToSpeechClient({
  keyFilename: './google-credentials.json'
});

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/stories", async (req, res) => {
    try {
      const { topic } = req.body;
      console.log('Generating story for topic:', topic);

      try {
        const { content, words } = await generateStory(topic);
        console.log('Generated story:', { content, wordCount: words.length });

        // Use the generated story content to create a more tailored illustration prompt
        console.log('Generating illustration for story about:', topic);
        const result = await fal.subscribe("fal-ai/recraft-20b", {
          input: {
            // Include both the topic and the actual story content in the prompt
            // This makes the illustration more relevant to the specific story
            prompt: `A children's book illustration that visually depicts the story: "${content}". The image should be cute, colorful, with a simple style, no text or captions, purely visual storytelling for a story about ${topic}`,
            negative_prompt: "text, words, letters, typography, writing, captions, labels, fonts, characters, scary, violent, religious symbols, political symbols, inappropriate content, (text:1.5), (words:1.5), (letters:1.5), (typography:1.5), (writing:1.5), (captions:1.5)",
          }
        }) as FalResponse;

        if (!result?.images?.[0]?.url) {
          throw new Error('Failed to generate illustration');
        }

        const imageUrl = result.images[0].url;
        console.log('Generated illustration URL:', imageUrl);

        const storyData = {
          topic,
          content,
          imageUrl,
          words,
        };

        const story = await storage.createStory(storyData);
        console.log('Story created successfully:', story.id);
        res.json(story);
      } catch (error: any) {
        if (error.message.includes('sensitive content') || error.message.includes('sensitive topics')) {
          res.status(400).json({ 
            error: error.message,
            type: 'CONTENT_FILTER'
          });
        } else {
          throw error; 
        }
      }
    } catch (error) {
      console.error('Error creating story:', error);
      res.status(500).json({ error: "Failed to create story" });
    }
  });

  app.get("/api/stories", async (_req, res) => {
    const stories = await storage.getAllStories();
    res.json(stories);
  });

  app.get("/api/stories/:id", async (req, res) => {
    const story = await storage.getStory(parseInt(req.params.id));
    if (!story) {
      res.status(404).json({ error: "Story not found" });
      return;
    }
    res.json(story);
  });

  app.post("/api/stories/:id/like", async (req, res) => {
    try {
      const story = await storage.incrementLikes(parseInt(req.params.id));
      if (!story) {
        res.status(404).json({ error: "Story not found" });
        return;
      }
      res.json(story);
    } catch (error) {
      console.error('Error liking story:', error);
      res.status(500).json({ error: "Failed to like story" });
    }
  });

  // New endpoint for AI-powered word comparison - for adult mode
  app.post("/api/compare-words", async (req, res) => {
    try {
      const { userWord, targetWord } = req.body;
      
      if (!userWord || !targetWord) {
        return res.status(400).json({ 
          error: "Both userWord and targetWord are required",
          similarity: 0
        });
      }
      
      console.log(`Comparing words: "${userWord}" vs "${targetWord}"`);
      const similarity = await compareWords(userWord, targetWord);
      
      console.log(`Similarity score: ${similarity}`);
      res.json({ similarity });
    } catch (error) {
      console.error('Error comparing words:', error);
      res.status(500).json({ 
        error: "Failed to compare words",
        similarity: 0
      });
    }
  });
  
  // New endpoint for smart word grouping - for compound words and phrases
  app.post("/api/smart-word-grouping", async (req, res) => {
    try {
      const { text } = req.body;
      
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ 
          error: "Valid text string is required",
          wordGroups: []
        });
      }
      
      console.log(`Processing text for smart grouping: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
      const wordGroups = await smartWordGrouping(text);
      
      console.log(`Smart grouping produced ${wordGroups.length} groups`);
      res.json({ wordGroups });
    } catch (error) {
      console.error('Error in smart word grouping:', error);
      res.status(500).json({ 
        error: "Failed to group words",
        wordGroups: []
      });
    }
  });
  
  // New endpoint for phoneme breakdown - for phoneme mode
  app.post("/api/phoneme-breakdown", async (req, res) => {
    try {
      const { text } = req.body;
      
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ 
          error: "Valid text string is required",
          phonemes: {}
        });
      }
      
      console.log(`Processing text for phoneme breakdown: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
      const phonemes = await getPhonemesBreakdown(text);
      
      console.log(`Phoneme breakdown produced entries for ${Object.keys(phonemes).length} words`);
      res.json({ phonemes });
    } catch (error) {
      console.error('Error in phoneme breakdown:', error);
      res.status(500).json({ 
        error: "Failed to break down phonemes",
        phonemes: {}
      });
    }
  });
  
  // Google Cloud Text-to-Speech API endpoint
  app.post("/api/tts", async (req, res) => {
    try {
      const { text, voice, audioConfig, useSSML } = req.body;
      
      if (!text) {
        return res.status(400).json({ 
          error: "Text is required for speech synthesis"
        });
      }
      
      console.log(`Google TTS request for: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
      console.log(`Using voice: ${voice.name}, Language: ${voice.languageCode}`);
      
      // Google Cloud TTS request
      const request = {
        input: useSSML ? { ssml: text } : { text },
        voice: voice,
        audioConfig: audioConfig || { audioEncoding: 'LINEAR16' }
      };
      
      // Make request to Google Cloud TTS
      const [response] = await ttsClient.synthesizeSpeech(request);
      
      if (!response.audioContent) {
        throw new Error('No audio content received from Google TTS');
      }
      
      // Convert audio content to base64
      const audioBase64 = Buffer.from(response.audioContent as Uint8Array).toString('base64');
      
      // Send back the audio content
      res.json({ audioContent: audioBase64 });
    } catch (error) {
      console.error('Error in Google TTS:', error);
      res.status(500).json({ 
        error: "Failed to synthesize speech"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}