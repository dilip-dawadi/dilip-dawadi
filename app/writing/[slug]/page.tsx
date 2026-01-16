import Markdown from 'markdown-to-jsx';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArticleSchema } from '@/components/Schema';
import PageWrapper from '@/components/Template/PageWrapper';
import { formatDate } from '@/lib/utils';
import { db } from '@/db';
import { blogPosts } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  content: string;
  coverImage: string | null;
  published: boolean | null;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
  authorId: string | null;
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getPost(slug: string): Promise<BlogPost | null> {
  try {
    const posts = await db
      .select()
      .from(blogPosts)
      .where(and(eq(blogPosts.slug, slug), eq(blogPosts.published, true)))
      .limit(1);

    return posts[0] || null;
  } catch (error) {
    console.error('Error fetching post:', error);
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  return {
    title: post.title,
    description: post.description || undefined,
    openGraph: {
      title: post.title,
      description: post.description || undefined,
      type: 'article',
      publishedTime: post.publishedAt?.toISOString() || post.createdAt.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      images: post.coverImage ? [{ url: post.coverImage }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description || undefined,
      images: post.coverImage ? [post.coverImage] : undefined,
    },
  };
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  const date = post.publishedAt || post.createdAt;
  const isValidDate = date && !isNaN(new Date(date).getTime());

  return (
    <PageWrapper>
      <ArticleSchema
        post={{
          slug: post.slug,
          title: post.title,
          description: post.description || '',
          content: post.content,
          date: isValidDate ? date.toISOString() : new Date().toISOString(),
        }}
      />
      <article className="post-page">
        <header className="post-header">
          {isValidDate && (
            <time className="post-date" dateTime={date.toISOString()}>
              {formatDate(date.toISOString())}
            </time>
          )}
          <h1 className="post-title">{post.title}</h1>
          {post.description && <p className="post-description">{post.description}</p>}
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
