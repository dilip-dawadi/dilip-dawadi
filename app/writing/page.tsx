'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import PageWrapper from '@/components/Template/PageWrapper';
import { Skeleton } from '@/components/ui/skeleton';
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
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch('/api/blog?published=true');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setBlogPosts(data);
        setError(false);
      } catch (error) {
        console.error('Error fetching blog posts:', error);
        setError(true);
        // Fallback to static data only when API fails
        import('@/data/writing').then((module) => {
          const writingData = module.default;
          // Convert static data to BlogPost format
          const fallbackPosts: BlogPost[] = writingData.map((item, index) => ({
            id: -(index + 1), // Negative IDs to distinguish from real posts
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
          setBlogPosts(fallbackPosts);
        });
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  // Convert database posts to unified format
  const items: UnifiedItem[] = blogPosts
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
            {error && (
              <div
                style={{
                  padding: '1rem',
                  marginBottom: '1rem',
                  backgroundColor: 'var(--color-bg-alt)',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--color-border)',
                }}
              >
                <p style={{ color: 'var(--color-fg-light)', fontSize: '0.875rem' }}>
                  ⚠️ Using cached content - API temporarily unavailable
                </p>
              </div>
            )}
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
