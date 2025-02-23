import { pgTable, text, serial, integer, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const stories = pgTable("stories", {
  id: serial("id").primaryKey(),
  topic: text("topic").notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url").notNull(),
  words: text("words").array().notNull(),
});

export const insertStorySchema = createInsertSchema(stories).pick({
  topic: true,
  content: true,
  imageUrl: true,
  words: true,
});

export type InsertStory = z.infer<typeof insertStorySchema>;
export type Story = typeof stories.$inferSelect;
