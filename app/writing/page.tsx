import Link from 'next/link';
import type { Metadata } from 'next';

import PageWrapper from '@/components/Template/PageWrapper';
import { formatDate } from '@/lib/utils';
import { db } from '@/db';
import { blogPosts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import writingData from '@/data/writing';

export const metadata: Metadata = {
  title: 'Writing',
  description:
    'Articles, tutorials, and thoughts on software development, web technologies, and engineering practices by Dilip Dawadi.',
  openGraph: {
    title: 'Writing - Dilip Dawadi',
    description:
      'Articles, tutorials, and thoughts on software development, web technologies, and engineering practices.',
    type: 'website',
  },
};

export const revalidate = 3600; // Revalidate every hour

interface UnifiedItem {
  title: string;
  url: string;
  date: string;
  description: string;
  isExternal: boolean;
}

interface BlogPost {
  id: number;
  slug: string;
  title: string;
  description: string;
  content: string;
  coverImage: string | null;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

// Extracted component to reduce duplication
interface WritingItemProps {
  item: UnifiedItem;
  showDate?: boolean;
}

function WritingItem({ item, showDate = true }: WritingItemProps) {
  const content = (
    <>
      {showDate && item.date && (
        <time className="writing-date" dateTime={item.date}>
          {formatDate(item.date)}
        </time>
      )}
      <h2 className="writing-title">{item.title}</h2>
      <p className="writing-description">{item.description}</p>
      {item.isExternal && (
        <span className="writing-external" aria-hidden="true">
          ↗
        </span>
      )}
    </>
  );

  if (item.isExternal) {
    return (
      <a href={item.url} target="_blank" rel="noopener noreferrer" className="writing-item">
        {content}
      </a>
    );
  }

  return (
    <Link href={item.url} className="writing-item">
      {content}
    </Link>
  );
}

async function getBlogPosts() {
  try {
    const posts = await db.select().from(blogPosts).where(eq(blogPosts.published, true));
    return posts;
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    // Fallback to static data if database query fails
    return writingData.map((item, index) => ({
      id: -(index + 1),
      slug: item.url.replace('/writing/', ''),
      title: item.title,
      description: item.description,
      content: '',
      coverImage: null,
      published: true,
      createdAt: item.date,
      updatedAt: item.date,
      publishedAt: item.date,
    }));
  }
}

export default async function WritingPage() {
  const posts = await getBlogPosts();

  // Convert database posts to unified format
  const items: UnifiedItem[] = posts
    .map((post) => {
      const date = post.publishedAt || post.createdAt;
      // Validate and convert date
      const isValidDate = date && !isNaN(new Date(date).getTime());
      const dateString = isValidDate ? new Date(date).toISOString() : '';

      return {
        title: post.title,
        url: `/writing/${post.slug}`,
        date: dateString,
        description: post.description || '',
        isExternal: false,
      };
    })
    .filter((item) => item.date); // Only include items with valid dates

  // Sort all items by date
  const dated = items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const undated = items.filter((item) => !item.date);

  return (
    <PageWrapper>
      <article className="writing-page">
        <header className="writing-header">
          <div className="writing-header-row">
            <h1 className="page-title">Writing</h1>
            <a href="/feed.xml" className="writing-rss-link" title="RSS Feed" aria-label="RSS Feed">
              RSS
            </a>
          </div>
        </header>

        <div className="writing-list">
          {dated.map((item) => (
            <WritingItem key={item.url} item={item} />
          ))}

          {undated.length > 0 && (
            <>
              <div className="writing-section-label">Guides</div>
              {undated.map((item) => (
                <WritingItem key={item.url} item={item} showDate={false} />
              ))}
            </>
          )}
        </div>
      </article>
    </PageWrapper>
  );
}
