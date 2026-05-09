import { defineCollection, z } from 'astro:content';

const commonSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  date: z.any().optional(),
  next: z.any().optional(),
  prev: z.any().optional(),
  footer: z.any().optional(),
});

const docs = defineCollection({
  type: 'content',
  schema: commonSchema,
});

const posts = defineCollection({
  type: 'content',
  schema: commonSchema,
});

export const collections = {
  docs,
  posts,
};
