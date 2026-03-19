import { source } from '@/lib/source';
import { createFromSource } from 'fumadocs-core/search/server';
import type { StructuredData } from 'fumadocs-core/mdx-plugins';

const emptyStructuredData: StructuredData = { headings: [], contents: [] };

export const { GET } = createFromSource(source, {
  // https://docs.orama.com/open-source/supported-languages
  language: 'english',
  buildIndex: (page) => ({
    title: page.data.title ?? page.slugs.at(-1) ?? '',
    description: page.data.description,
    url: page.url,
    id: page.url,
    structuredData: (page.data as { structuredData?: StructuredData }).structuredData ?? emptyStructuredData,
  }),
});
