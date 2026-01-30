import { db } from '@/db';
import { blogPosts } from '@/db/schema';
import { checkAdminAccess } from '@/lib/admin';
import { NextResponse } from 'next/server';
import { eq, desc } from 'drizzle-orm';
import { notifyUnauthorizedAccess, notifyDatabaseError } from '@/lib/gmail';

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
    // Notify about database error for critical read operations
    try {
      await notifyDatabaseError({
        operation: 'fetch blog posts',
        error: error instanceof Error ? error.message : String(error),
        table: 'blogPosts',
      });
    } catch (notifyError) {
      console.error('Failed to send notification:', notifyError);
    }
    return NextResponse.json({ error: 'Failed to fetch blog posts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { isAdmin, session } = await checkAdminAccess();

    if (!isAdmin || !session) {
      // Notify about unauthorized access attempt
      try {
        await notifyUnauthorizedAccess({
          path: '/api/blog',
          ipAddress: request.headers.get('x-forwarded-for') || undefined,
          userAgent: request.headers.get('user-agent') || undefined,
          attemptedAction: 'Create blog post (POST)',
        });
      } catch (notifyError) {
        console.error('Failed to send notification:', notifyError);
      }
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
        authorId: session?.user?.id || null,
      })
      .returning();

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Error creating blog post:', error);
    // Notify about database error
    try {
      await notifyDatabaseError({
        operation: 'create blog post',
        error: error instanceof Error ? error.message : String(error),
        table: 'blogPosts',
      });
    } catch (notifyError) {
      console.error('Failed to send notification:', notifyError);
    }
    return NextResponse.json({ error: 'Failed to create blog post' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { isAdmin } = await checkAdminAccess();

    if (!isAdmin) {
      // Notify about unauthorized access attempt
      try {
        await notifyUnauthorizedAccess({
          path: '/api/blog',
          ipAddress: request.headers.get('x-forwarded-for') || undefined,
          userAgent: request.headers.get('user-agent') || undefined,
          attemptedAction: 'Update blog post (PUT)',
        });
      } catch (notifyError) {
        console.error('Failed to send notification:', notifyError);
      }
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
    // Notify about database error
    try {
      await notifyDatabaseError({
        operation: 'update blog post',
        error: error instanceof Error ? error.message : String(error),
        table: 'blogPosts',
      });
    } catch (notifyError) {
      console.error('Failed to send notification:', notifyError);
    }
    return NextResponse.json({ error: 'Failed to update blog post' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { isAdmin } = await checkAdminAccess();

    if (!isAdmin) {
      // Notify about unauthorized access attempt
      try {
        await notifyUnauthorizedAccess({
          path: '/api/blog',
          ipAddress: request.headers.get('x-forwarded-for') || undefined,
          userAgent: request.headers.get('user-agent') || undefined,
          attemptedAction: 'Delete blog post (DELETE)',
        });
      } catch (notifyError) {
        console.error('Failed to send notification:', notifyError);
      }
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
    // Notify about database error
    try {
      await notifyDatabaseError({
        operation: 'delete blog post',
        error: error instanceof Error ? error.message : String(error),
        table: 'blogPosts',
      });
    } catch (notifyError) {
      console.error('Failed to send notification:', notifyError);
    }
    return NextResponse.json({ error: 'Failed to delete blog post' }, { status: 500 });
  }
}
