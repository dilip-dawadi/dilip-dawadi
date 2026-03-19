import { and, desc, eq, gte, lt } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { financeTransactions, financeWorkLogs, todos } from '@/db/schema';
import { auth } from '@/lib/auth';
import { financeWorkLogSchema, updateFinanceWorkLogSchema } from '@/lib/validations';

function parseWorkDate(value?: string): Date {
  if (!value) {
    return new Date();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function amountFromWork(minutesWorked: number, hourlyRateCents: number): number {
  return Math.round((minutesWorked / 60) * hourlyRateCents);
}

async function resolveTodoId(todoId: string | undefined, userId: string): Promise<string | null> {
  if (!todoId) {
    return null;
  }

  const [todo] = await db
    .select({ id: todos.id })
    .from(todos)
    .where(and(eq(todos.id, todoId), eq(todos.userId, userId)))
    .limit(1);

  return todo?.id || null;
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month');

  let whereClause = eq(financeWorkLogs.userId, session.user.id);

  if (month) {
    const start = new Date(`${month}-01T00:00:00.000Z`);
    if (!Number.isNaN(start.getTime())) {
      const end = new Date(start);
      end.setUTCMonth(end.getUTCMonth() + 1);
      whereClause = and(
        eq(financeWorkLogs.userId, session.user.id),
        gte(financeWorkLogs.workDate, start),
        lt(financeWorkLogs.workDate, end),
      ) as typeof whereClause;
    }
  }

  const result = await db
    .select()
    .from(financeWorkLogs)
    .where(whereClause)
    .orderBy(desc(financeWorkLogs.workDate), desc(financeWorkLogs.createdAt));

  return NextResponse.json(result, { status: 200 });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = financeWorkLogSchema.parse(body);
    const validatedTodoId = await resolveTodoId(parsed.todoId || undefined, session.user.id);

    const workDate = parseWorkDate(parsed.workDate);
    const amountCents = amountFromWork(parsed.minutesWorked, parsed.hourlyRateCents);

    const [createdIncome] = await db
      .insert(financeTransactions)
      .values({
        userId: session.user.id,
        type: 'income',
        amountCents,
        category: 'salary',
        note: parsed.note?.trim() || 'Work income log',
        happenedAt: workDate,
        isRecurring: false,
        recurringInterval: null,
      })
      .returning();

    const [createdWorkLog] = await db
      .insert(financeWorkLogs)
      .values({
        userId: session.user.id,
        todoId: validatedTodoId,
        workDate,
        minutesWorked: parsed.minutesWorked,
        hourlyRateCents: parsed.hourlyRateCents,
        note: parsed.note?.trim() || null,
        incomeTransactionId: createdIncome.id,
      })
      .returning();

    return NextResponse.json(createdWorkLog, { status: 201 });
  } catch (error) {
    console.error('Failed to create work log:', error);
    return NextResponse.json({ error: 'Failed to create work log' }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = updateFinanceWorkLogSchema.parse(body);
    const validatedTodoId = await resolveTodoId(parsed.todoId || undefined, session.user.id);

    const [existing] = await db
      .select()
      .from(financeWorkLogs)
      .where(and(eq(financeWorkLogs.id, parsed.id), eq(financeWorkLogs.userId, session.user.id)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: 'Work log not found' }, { status: 404 });
    }

    const workDate = parseWorkDate(parsed.workDate);
    const amountCents = amountFromWork(parsed.minutesWorked, parsed.hourlyRateCents);

    if (existing.incomeTransactionId) {
      await db
        .update(financeTransactions)
        .set({
          amountCents,
          note: parsed.note?.trim() || 'Work income log',
          happenedAt: workDate,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(financeTransactions.id, existing.incomeTransactionId),
            eq(financeTransactions.userId, session.user.id),
          ),
        );
    }

    const [updated] = await db
      .update(financeWorkLogs)
      .set({
        todoId: validatedTodoId,
        workDate,
        minutesWorked: parsed.minutesWorked,
        hourlyRateCents: parsed.hourlyRateCents,
        note: parsed.note?.trim() || null,
        updatedAt: new Date(),
      })
      .where(and(eq(financeWorkLogs.id, parsed.id), eq(financeWorkLogs.userId, session.user.id)))
      .returning();

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('Failed to update work log:', error);
    return NextResponse.json({ error: 'Failed to update work log' }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Work log id is required' }, { status: 400 });
  }

  const [existing] = await db
    .select()
    .from(financeWorkLogs)
    .where(and(eq(financeWorkLogs.id, id), eq(financeWorkLogs.userId, session.user.id)))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: 'Work log not found' }, { status: 404 });
  }

  await db
    .delete(financeWorkLogs)
    .where(and(eq(financeWorkLogs.id, id), eq(financeWorkLogs.userId, session.user.id)));

  if (existing.incomeTransactionId) {
    await db
      .delete(financeTransactions)
      .where(
        and(
          eq(financeTransactions.id, existing.incomeTransactionId),
          eq(financeTransactions.userId, session.user.id),
        ),
      );
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
