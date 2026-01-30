import { db } from '@/db';
import { aboutContent } from '@/db/schema';
import { checkAdminAccess } from '@/lib/admin';
import { NextResponse } from 'next/server';
import { notifyUnauthorizedAccess, notifyDatabaseError } from '@/lib/gmail';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const content = await db.select().from(aboutContent).limit(1);

    if (content.length === 0) {
      return NextResponse.json({ content: '' }, { status: 200 });
    }

    return NextResponse.json(content[0], { status: 200 });
  } catch (error) {
    console.error('Error fetching about content:', error);
    // Notify about database error for critical read operations
    try {
      await notifyDatabaseError({
        operation: 'fetch about content',
        error: error instanceof Error ? error.message : String(error),
        table: 'aboutContent',
      });
    } catch (notifyError) {
      console.error('Failed to send notification:', notifyError);
    }
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { isAdmin, session } = await checkAdminAccess();

    if (!isAdmin || !session) {
      // Notify about unauthorized access attempt
      try {
        await notifyUnauthorizedAccess({
          path: '/api/about',
          ipAddress: request.headers.get('x-forwarded-for') || undefined,
          userAgent: request.headers.get('user-agent') || undefined,
          attemptedAction: 'Update about content (POST)',
        });
      } catch (notifyError) {
        console.error('Failed to send notification:', notifyError);
      }
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { content } = await request.json();

    const result = await db
      .insert(aboutContent)
      .values({
        id: 'default',
        content,
        updatedAt: new Date(),
        updatedBy: session?.user?.id || null,
      })
      .onConflictDoUpdate({
        target: aboutContent.id,
        set: {
          content,
          updatedAt: new Date(),
          updatedBy: session?.user?.id || null,
        },
      })
      .returning();

    return NextResponse.json(result[0], { status: 200 });
  } catch (error) {
    console.error('Error updating about content:', error);
    // Notify about database error
    try {
      await notifyDatabaseError({
        operation: 'update about content',
        error: error instanceof Error ? error.message : String(error),
        table: 'aboutContent',
      });
    } catch (notifyError) {
      console.error('Failed to send notification:', notifyError);
    }
    return NextResponse.json({ error: 'Failed to update content' }, { status: 500 });
  }
}
