import { db } from '@/db';
import { projects } from '@/db/schema';
import { checkAdminAccess } from '@/lib/admin';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const allProjects = await db.select().from(projects).orderBy(projects.date);
    return NextResponse.json(allProjects, { status: 200 });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { isAdmin } = await checkAdminAccess();

    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { title, subtitle, link, image, date, description, tech, featured } = body;

    const newId = `project-${Date.now()}`;
    const result = await db
      .insert(projects)
      .values({
        id: newId,
        title,
        subtitle,
        link,
        image,
        date,
        description,
        tech,
        featured: featured || false,
      })
      .returning();

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
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
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    const body = await request.json();
    const { title, subtitle, link, image, date, description, tech, featured } = body;

    const result = await db
      .update(projects)
      .set({
        title,
        subtitle,
        link,
        image,
        date,
        description,
        tech,
        featured,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, id))
      .returning();

    return NextResponse.json(result[0], { status: 200 });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
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
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    await db.delete(projects).where(eq(projects.id, id));

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
