import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const commonSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  date: z.any().optional(),
  next: z.any().optional(),
  prev: z.any().optional(),
  footer: z.any().optional(),
});

const docs = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/docs' }),
  schema: commonSchema,
});

const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: commonSchema,
});

export const collections = {
  docs,
  posts,
};