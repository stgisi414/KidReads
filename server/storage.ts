import { stories, type Story, type InsertStory } from "@shared/schema";

export interface IStorage {
  getStory(id: number): Promise<Story | undefined>;
  getStoryByTopic(topic: string): Promise<Story | undefined>;
  createStory(story: InsertStory): Promise<Story>;
  getAllStories(): Promise<Story[]>;
}

export class MemStorage implements IStorage {
  private stories: Map<number, Story>;
  currentId: number;

  constructor() {
    this.stories = new Map();
    this.currentId = 1;
  }

  async getStory(id: number): Promise<Story | undefined> {
    return this.stories.get(id);
  }

  async getStoryByTopic(topic: string): Promise<Story | undefined> {
    return Array.from(this.stories.values()).find(
      (story) => story.topic.toLowerCase() === topic.toLowerCase(),
    );
  }

  async createStory(insertStory: InsertStory): Promise<Story> {
    const id = this.currentId++;
    const story: Story = { ...insertStory, id };
    this.stories.set(id, story);
    return story;
  }

  async getAllStories(): Promise<Story[]> {
    return Array.from(this.stories.values());
  }
}

export const storage = new MemStorage();
