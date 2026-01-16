'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import PageWrapper from '@/components/Template/PageWrapper';
import { Skeleton } from '@/components/ui/skeleton';
import writing from '@/data/writing';
import { formatDate } from '@/lib/utils';

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

export default function WritingPage() {
  const [loading, setLoading] = useState(true);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch('/api/blog?published=true');
        const data = await res.json();
        setBlogPosts(data);
      } catch (error) {
        console.error('Error fetching blog posts:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  // Convert database posts to unified format
  const internalItems: UnifiedItem[] = blogPosts
    .map((post) => {
      const date = post.publishedAt || post.createdAt;
      // Validate date
      const isValidDate = date && !isNaN(new Date(date).getTime());

      return {
        title: post.title,
        url: `/writing/${post.slug}`,
        date: isValidDate ? date : '',
        description: post.description,
        isExternal: false,
      };
    })
    .filter((item) => item.date); // Only include items with valid dates

  // Get external articles from data file
  const externalItems: UnifiedItem[] = writing.map((item) => ({
    ...item,
    isExternal: true,
  }));

  // Merge and sort all items
  const allItems = [...internalItems, ...externalItems];
  const dated = allItems
    .filter((item) => item.date)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const undated = allItems.filter((item) => !item.date);

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

        {loading ? (
          <div className="writing-list">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="writing-item"
                style={{ padding: '1.5rem 0', borderBottom: '1px solid var(--color-border)' }}
              >
                <Skeleton className="h-7 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        ) : (
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
        )}
      </article>
    </PageWrapper>
  );
}
