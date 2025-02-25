import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertStorySchema } from "@shared/schema";
import { generateStory } from "./services/ai";
import fal from "@fal-ai/serverless-client";
import Voice from "elevenlabs-node";

if (!process.env.FAL_AI_API_KEY) {
  throw new Error("FAL_AI_API_KEY is required");
}

if (!process.env.ELEVENLABS_API_KEY) {
  throw new Error("ELEVENLABS_API_KEY is required");
}

fal.config({
  credentials: process.env.FAL_AI_API_KEY,
});

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/tts", async (req, res) => {
    try {
      const { text, voiceId } = req.body;

      if (!text || !voiceId) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      const voice = new Voice({
        apiKey: process.env.ELEVENLABS_API_KEY as string,
        voiceId: voiceId
      });

      if (!voice) {
        throw new Error('Failed to initialize ElevenLabs voice client');
      }

      console.log('✅ Voice client initialized, generating audio for:', text);
      const audioBuffer = await voice.textToSpeech(text);

      if (!audioBuffer) {
        throw new Error('Failed to generate audio buffer');
      }

      console.log('✅ Successfully generated audio buffer');
      res.setHeader('Content-Type', 'audio/mpeg');
      res.send(Buffer.from(audioBuffer));
    } catch (error) {
      console.error('Error generating speech:', error);
      res.status(500).json({ error: "Failed to generate speech" });
    }
  });

  app.post("/api/stories", async (req, res) => {
    try {
      const { topic } = req.body;
      console.log('Generating story for topic:', topic);

      const { content, words } = await generateStory(topic);
      console.log('Generated story:', { content, wordCount: words.length });

      console.log('Generating illustration for topic:', topic);
      const result = await fal.subscribe("fal-ai/fast-lightning-sdxl", {
        input: {
          prompt: `A children's book illustration of ${topic}, cute, colorful, simple style`,
          negative_prompt: "text, words, letters, scary, violent",
        }
      });

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

  const httpServer = createServer(app);
  return httpServer;
}