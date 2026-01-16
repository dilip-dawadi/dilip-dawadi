'use client';

import { useEffect, useState } from 'react';
import Markdown from 'markdown-to-jsx';
import Image from 'next/image';
import { useParams, notFound } from 'next/navigation';
import { ArticleSchema } from '@/components/Schema';
import PageWrapper from '@/components/Template/PageWrapper';
import { formatDate } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

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

export default function PostPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundError, setNotFoundError] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(`/api/blog?slug=${slug}&published=true`);
        if (!res.ok) {
          setNotFoundError(true);
          return;
        }
        const data = await res.json();
        if (!data) {
          setNotFoundError(true);
          return;
        }
        setPost(data);
      } catch (error) {
        console.error('Error fetching post:', error);
        setNotFoundError(true);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchPost();
    }
  }, [slug]);

  if (loading) {
    return (
      <PageWrapper>
        <article className="content-article">
          <header className="article-header">
            <Skeleton className="h-12 w-3/4 mb-4" />
            <Skeleton className="h-5 w-40 mb-6" />
            <Skeleton className="h-64 w-full mb-6" />
          </header>
          <div className="article-content">
            <Skeleton className="h-4 w-full mb-3" />
            <Skeleton className="h-4 w-full mb-3" />
            <Skeleton className="h-4 w-5/6 mb-6" />
            <Skeleton className="h-4 w-full mb-3" />
            <Skeleton className="h-4 w-full mb-3" />
            <Skeleton className="h-4 w-4/5 mb-6" />
          </div>
        </article>
      </PageWrapper>
    );
  }

  if (notFoundError || !post) {
    return (
      <PageWrapper>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h1 style={{ color: 'var(--color-fg-bold)' }}>Post Not Found</h1>
          <p style={{ color: 'var(--color-fg-light)' }}>
            The post you're looking for doesn't exist.
          </p>
        </div>
      </PageWrapper>
    );
  }

  const date = post.publishedAt || post.createdAt;
  const isValidDate = date && !isNaN(new Date(date).getTime());

  return (
    <PageWrapper>
      <ArticleSchema
        post={{
          slug: post.slug,
          title: post.title,
          description: post.description,
          content: post.content,
          date: isValidDate ? date : new Date().toISOString(),
        }}
      />
      <article className="post-page">
        <header className="post-header">
          {isValidDate && (
            <time className="post-date" dateTime={date}>
              {formatDate(date)}
            </time>
          )}
          <h1 className="post-title">{post.title}</h1>
          <p className="post-description">{post.description}</p>
        </header>
        <div className="post-content prose">
          <Markdown
            options={{
              overrides: {
                img: {
                  component: ({ alt, src }: { alt?: string; src?: string }) => (
                    <Image
                      src={src || ''}
                      alt={alt || ''}
                      width={1200}
                      height={630}
                      loading="lazy"
                      style={{
                        width: '100%',
                        height: 'auto',
                      }}
                    />
                  ),
                },
              },
            }}
          >
            {post.content}
          </Markdown>
        </div>
      </article>
    </PageWrapper>
  );
}
