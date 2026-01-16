import { db } from '@/db';
import { blogPosts } from '@/db/schema';
import { checkAdminAccess } from '@/lib/admin';
import { NextResponse } from 'next/server';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const published = searchParams.get('published');
    const slug = searchParams.get('slug');

    if (slug) {
      const post = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug)).limit(1);
      return NextResponse.json(post[0] || null, { status: 200 });
    }

    let posts;
    if (published === 'true') {
      posts = await db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.published, true))
        .orderBy(desc(blogPosts.publishedAt));
    } else {
      posts = await db.select().from(blogPosts).orderBy(desc(blogPosts.createdAt));
    }

    return NextResponse.json(posts, { status: 200 });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json({ error: 'Failed to fetch blog posts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { isAdmin, session } = await checkAdminAccess();

    if (!isAdmin || !session) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { slug, title, description, content, coverImage, published } = body;

    const newId = `post-${Date.now()}`;
    const result = await db
      .insert(blogPosts)
      .values({
        id: newId,
        slug,
        title,
        description,
        content,
        coverImage,
        published: published || false,
        publishedAt: published ? new Date() : null,
        authorId: session.user.id,
      })
      .returning();

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Error creating blog post:', error);
    return NextResponse.json({ error: 'Failed to create blog post' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { isAdmin } = await checkAdminAccess();

    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Blog post ID required' }, { status: 400 });
    }

    const body = await request.json();
    const { slug, title, description, content, coverImage, published } = body;

    const updateData: any = {
      slug,
      title,
      description,
      content,
      coverImage,
      published,
      updatedAt: new Date(),
    };

    if (published) {
      updateData.publishedAt = new Date();
    }

    const result = await db
      .update(blogPosts)
      .set(updateData)
      .where(eq(blogPosts.id, id))
      .returning();

    return NextResponse.json(result[0], { status: 200 });
  } catch (error) {
    console.error('Error updating blog post:', error);
    return NextResponse.json({ error: 'Failed to update blog post' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { isAdmin } = await checkAdminAccess();

    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Blog post ID required' }, { status: 400 });
    }

    await db.delete(blogPosts).where(eq(blogPosts.id, id));

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    return NextResponse.json({ error: 'Failed to delete blog post' }, { status: 500 });
  }
}
