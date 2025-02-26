import { stories, readingSessions, type Story, type InsertStory } from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";

export interface IStorage {
  getStory(id: number): Promise<Story | undefined>;
  getStoryByTopic(topic: string): Promise<Story | undefined>;
  createStory(story: InsertStory): Promise<Story>;
  getAllStories(): Promise<Story[]>;
  incrementLikes(storyId: number): Promise<Story | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getStory(id: number): Promise<Story | undefined> {
    const [story] = await db.select().from(stories).where(eq(stories.id, id));
    return story;
  }

  async getStoryByTopic(topic: string): Promise<Story | undefined> {
    const [story] = await db
      .select()
      .from(stories)
      .where(eq(stories.topic, topic))
      .orderBy(desc(stories.createdAt))
      .limit(1);
    return story;
  }

  async createStory(insertStory: InsertStory): Promise<Story> {
    const [story] = await db.insert(stories).values(insertStory).returning();
    return story;
  }

  async getAllStories(): Promise<Story[]> {
    return db.select().from(stories).orderBy(desc(stories.createdAt));
  }

  async incrementLikes(storyId: number): Promise<Story | undefined> {
    const [story] = await db
      .update(stories)
      .set({ likes: sql`${stories.likes} + 1` })
      .where(eq(stories.id, storyId))
      .returning();
    return story;
  }
}

export const storage = new DatabaseStorage();