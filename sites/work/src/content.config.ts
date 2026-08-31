import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/**
 * Notes are Markdown files in content/notes/. Anything with draft: true is
 * excluded from the build entirely — it never gets a public URL.
 */
const notes = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./content/notes" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    summary: z.string(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { notes };
