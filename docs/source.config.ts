import {
  defineConfig,
  defineDocs,
  frontmatterSchema,
  metaSchema,
} from "fumadocs-mdx/config";
import { z } from "zod";

const changelogEntrySchema = z.object({
  version: z.string(),
  date: z.string().optional(),
  changes: z.array(z.string()).min(1),
});

// You can customise Zod schemas for frontmatter and `meta.json` here
// see https://fumadocs.vercel.app/docs/mdx/collections#define-docs
export const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    schema: frontmatterSchema.extend({
      componentName: z.string().optional(),
      componentImport: z.string().optional(),
      source: z.union([z.string(), z.array(z.string())]).optional(),
      changelog: z.array(changelogEntrySchema).optional(),
    }),
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

export default defineConfig({
  mdxOptions: {
    // MDX options
  },
});
