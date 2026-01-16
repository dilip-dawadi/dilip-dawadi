import { db } from '@/db';
import { aboutContent } from '@/db/schema';
import { checkAdminAccess } from '@/lib/admin';
import { NextResponse } from 'next/server';

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
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { isAdmin, session } = await checkAdminAccess();

    if (!isAdmin || !session) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { content } = await request.json();

    const result = await db
      .insert(aboutContent)
      .values({
        id: 'default',
        content,
        updatedAt: new Date(),
        updatedBy: session.user.id,
      })
      .onConflictDoUpdate({
        target: aboutContent.id,
        set: {
          content,
          updatedAt: new Date(),
          updatedBy: session.user.id,
        },
      })
      .returning();

    return NextResponse.json(result[0], { status: 200 });
  } catch (error) {
    console.error('Error updating about content:', error);
    return NextResponse.json({ error: 'Failed to update content' }, { status: 500 });
  }
}
