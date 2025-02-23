import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertStorySchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/stories", async (req, res) => {
    try {
      const storyData = insertStorySchema.parse(req.body);
      const story = await storage.createStory(storyData);
      res.json(story);
    } catch (error) {
      res.status(400).json({ error: "Invalid story data" });
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
