import { source } from '@/lib/source';
import type { InferPageType } from 'fumadocs-core/source';

type PageDataWithBody = {
  title: string;
  getText: (type: 'processed' | 'raw') => Promise<string>;
};

export async function getLLMText(page: InferPageType<typeof source>) {
  const pageData = page.data as PageDataWithBody;
  const processed = await pageData.getText('processed');

  return `# ${pageData.title} (${page.url})

${processed}`;
}
