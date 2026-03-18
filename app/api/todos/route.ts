import { and, asc, desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { todos } from '@/db/schema';
import { auth } from '@/lib/auth';
import { todoFormSchema, updateTodoSchema } from '@/lib/validations';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function parseReminderDate(remindAt?: string): Date | null {
  if (!remindAt) {
    return null;
  }

  const parsed = new Date(remindAt);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await db
    .select()
    .from(todos)
    .where(eq(todos.userId, session.user.id))
    .orderBy(desc(todos.createdAt), asc(todos.remindAt));

  return NextResponse.json(result, { status: 200 });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = todoFormSchema.parse(body);

    const [created] = await db
      .insert(todos)
      .values({
        userId: session.user.id,
        title: parsed.title,
        description: parsed.description || null,
        priority: parsed.priority,
        status: parsed.status,
        remindAt: parseReminderDate(parsed.remindAt),
        emailReminder: parsed.emailReminder,
        pushReminder: parsed.pushReminder,
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Failed to create todo:', error);
    return NextResponse.json(
      { error: 'Failed to create todo' },
      { status: 400 },
    );
  }
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = updateTodoSchema.parse(body);

    const [updated] = await db
      .update(todos)
      .set({
        title: parsed.title,
        description: parsed.description || null,
        priority: parsed.priority,
        status: parsed.status,
        remindAt: parseReminderDate(parsed.remindAt),
        emailReminder: parsed.emailReminder,
        pushReminder: parsed.pushReminder,
        updatedAt: new Date(),
      })
      .where(and(eq(todos.id, parsed.id), eq(todos.userId, session.user.id)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('Failed to update todo:', error);
    return NextResponse.json(
      { error: 'Failed to update todo' },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Todo id is required' }, { status: 400 });
  }

  const [deleted] = await db
    .delete(todos)
    .where(and(eq(todos.id, id), eq(todos.userId, session.user.id)))
    .returning({ id: todos.id });

  if (!deleted) {
    return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
