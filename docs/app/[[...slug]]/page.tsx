import { source } from '@/lib/source';
import {
  DocsPage,
  DocsBody,
  DocsDescription,
  DocsTitle,
} from 'fumadocs-ui/page';
import { notFound } from 'next/navigation';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import { getMDXComponents } from '@/mdx-components';
import { LLMCopyButton, ViewOptions } from '@/components/page-actions';
import type React from 'react';
import type { MDXComponents } from 'mdx/types';

type PageDataWithBody = {
  body: React.ComponentType<{ components?: MDXComponents }>;
  toc: Array<{ title: string; url: string; depth: number }>;
  full: boolean;
  title: string;
  description?: string;
  getText: (type: 'processed' | 'raw') => Promise<string>;
};

export default async function Page(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const pageData = page.data as PageDataWithBody;
  const MDXContent = pageData.body;

  return (
    <DocsPage toc={pageData.toc} full={pageData.full}>
      <div className="flex flex-row gap-2 items-center border-b pt-2 pb-6">
        <LLMCopyButton markdownUrl={`${page.url}.mdx`} />
        <ViewOptions
          markdownUrl={`${page.url}.mdx`}
          githubUrl={`https://github.com/pipecat-ai/voice-ui-kit/blob/main/docs/content/docs/${page.path}`}
        />
      </div>
      <DocsTitle>{pageData.title}</DocsTitle>
      <DocsDescription>{pageData.description}</DocsDescription>
      <DocsBody>
        <MDXContent
          components={getMDXComponents({
            // this allows you to link to other pages with relative file paths
            a: createRelativeLink(source, page),
          })}
        />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const pageData = page.data as PageDataWithBody;

  return {
    title: pageData.title,
    description: pageData.description,
  };
}
