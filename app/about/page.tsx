import Markdown from 'markdown-to-jsx';
import type { Metadata } from 'next';

import PageWrapper from '@/components/Template/PageWrapper';
import { aboutMarkdown } from '@/data/about';
import { db } from '@/db';
import { aboutContent } from '@/db/schema';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Learn about Dilip Dawadi - Full-Stack Software Developer with 3.5+ years of experience building scalable web applications.',
};

export const revalidate = 86400; // Revalidate every 24 hours

const countWords = (str: string) => str.split(/\s+/).filter((word) => word !== '').length;

async function getAboutContent() {
  try {
    const content = await db.select().from(aboutContent).limit(1);
    return content[0]?.content || aboutMarkdown;
  } catch (error) {
    console.error('Error fetching about content:', error);
    return aboutMarkdown;
  }
}

export default async function AboutPage() {
  const content = await getAboutContent();

  return (
    <PageWrapper>
      <section className="about-page">
        <header className="about-header">
          <h1 className="page-title">About Me</h1>
          <p className="page-subtitle">A quick intro in {countWords(content)} words</p>
        </header>
        <article className="about-content">
          <Markdown>{content}</Markdown>
        </article>
      </section>
    </PageWrapper>
  );
}
