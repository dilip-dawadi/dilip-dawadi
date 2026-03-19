import { and, desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { financeReceivables, financeTransactions, financeWorkLogs, todos } from '@/db/schema';
import { auth } from '@/lib/auth';
import { financeReceivableSchema, updateFinanceReceivableSchema } from '@/lib/validations';

function parseDate(value?: string): Date | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function clean(value?: string): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
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

async function resolveWorkLogId(
  workLogId: string | undefined,
  userId: string,
): Promise<string | null> {
  if (!workLogId) {
    return null;
  }

  const [log] = await db
    .select({ id: financeWorkLogs.id })
    .from(financeWorkLogs)
    .where(and(eq(financeWorkLogs.id, workLogId), eq(financeWorkLogs.userId, userId)))
    .limit(1);

  return log?.id || null;
}

async function createIncomeTransactionForReceivable(input: {
  userId: string;
  amountCents: number;
  category?: string;
  title: string;
  payerName: string;
  paidAt: Date;
  note: string | null;
}) {
  const [created] = await db
    .insert(financeTransactions)
    .values({
      userId: input.userId,
      type: 'income',
      amountCents: input.amountCents,
      category: input.category || 'general',
      note: input.note || `Receivable paid: ${input.title} (${input.payerName})`,
      happenedAt: input.paidAt,
      isRecurring: false,
      recurringInterval: null,
    })
    .returning({ id: financeTransactions.id });

  return created?.id || null;
}

async function deleteLinkedIncomeTransaction(userId: string, transactionId: string | null) {
  if (!transactionId) {
    return;
  }

  await db
    .delete(financeTransactions)
    .where(and(eq(financeTransactions.id, transactionId), eq(financeTransactions.userId, userId)));
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  const where =
    status && (status === 'pending' || status === 'paid')
      ? and(eq(financeReceivables.userId, session.user.id), eq(financeReceivables.status, status))
      : eq(financeReceivables.userId, session.user.id);

  const result = await db
    .select()
    .from(financeReceivables)
    .where(where)
    .orderBy(desc(financeReceivables.status), desc(financeReceivables.createdAt));

  return NextResponse.json(result, { status: 200 });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = financeReceivableSchema.parse(body);

    const todoId = await resolveTodoId(parsed.todoId || undefined, session.user.id);
    const workLogId = await resolveWorkLogId(parsed.workLogId || undefined, session.user.id);

    const now = new Date();
    const paidAt = parsed.status === 'paid' ? parseDate(parsed.dueAt) || now : null;

    const incomeTransactionId =
      parsed.status === 'paid'
        ? await createIncomeTransactionForReceivable({
            userId: session.user.id,
            amountCents: parsed.amountCents,
            category: parsed.category,
            title: parsed.title,
            payerName: parsed.payerName,
            paidAt: paidAt || now,
            note: clean(parsed.note),
          })
        : null;

    const [created] = await db
      .insert(financeReceivables)
      .values({
        userId: session.user.id,
        todoId,
        workLogId,
        payerName: parsed.payerName.trim(),
        payerEmail: clean(parsed.payerEmail),
        title: parsed.title.trim(),
        category: clean(parsed.category) || 'general',
        groupKey: clean(parsed.groupKey),
        amountCents: parsed.amountCents,
        status: parsed.status,
        dueAt: parseDate(parsed.dueAt),
        note: clean(parsed.note),
        minutesWorked: parsed.minutesWorked || null,
        hourlyRateCents: parsed.hourlyRateCents || null,
        includeWorkDetails: parsed.includeWorkDetails,
        paidAt,
        incomeTransactionId,
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Failed to create receivable:', error);
    return NextResponse.json({ error: 'Failed to create receivable' }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = updateFinanceReceivableSchema.parse(body);

    const [existing] = await db
      .select()
      .from(financeReceivables)
      .where(
        and(eq(financeReceivables.id, parsed.id), eq(financeReceivables.userId, session.user.id)),
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: 'Receivable not found' }, { status: 404 });
    }

    const todoId = await resolveTodoId(parsed.todoId || undefined, session.user.id);
    const workLogId = await resolveWorkLogId(parsed.workLogId || undefined, session.user.id);

    const now = new Date();
    let incomeTransactionId = existing.incomeTransactionId;
    let paidAt = existing.paidAt;

    if (parsed.status === 'paid') {
      const paidMoment = paidAt || now;
      paidAt = paidMoment;

      if (!incomeTransactionId) {
        incomeTransactionId = await createIncomeTransactionForReceivable({
          userId: session.user.id,
          amountCents: parsed.amountCents,
          category: clean(parsed.category) || 'general',
          title: parsed.title,
          payerName: parsed.payerName,
          paidAt: paidMoment,
          note: clean(parsed.note),
        });
      } else {
        await db
          .update(financeTransactions)
          .set({
            amountCents: parsed.amountCents,
            category: clean(parsed.category) || 'general',
            note:
              clean(parsed.note) ||
              `Receivable paid: ${parsed.title.trim()} (${parsed.payerName.trim()})`,
            happenedAt: paidMoment,
            updatedAt: now,
          })
          .where(
            and(
              eq(financeTransactions.id, incomeTransactionId),
              eq(financeTransactions.userId, session.user.id),
            ),
          );
      }
    } else if (existing.status === 'paid' && parsed.status === 'pending') {
      await deleteLinkedIncomeTransaction(session.user.id, incomeTransactionId);
      incomeTransactionId = null;
      paidAt = null;
    }

    const [updated] = await db
      .update(financeReceivables)
      .set({
        todoId,
        workLogId,
        payerName: parsed.payerName.trim(),
        payerEmail: clean(parsed.payerEmail),
        title: parsed.title.trim(),
        category: clean(parsed.category) || 'general',
        groupKey: clean(parsed.groupKey),
        amountCents: parsed.amountCents,
        status: parsed.status,
        dueAt: parseDate(parsed.dueAt),
        note: clean(parsed.note),
        minutesWorked: parsed.minutesWorked || null,
        hourlyRateCents: parsed.hourlyRateCents || null,
        includeWorkDetails: parsed.includeWorkDetails,
        paidAt,
        incomeTransactionId,
        updatedAt: now,
      })
      .where(
        and(eq(financeReceivables.id, parsed.id), eq(financeReceivables.userId, session.user.id)),
      )
      .returning();

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('Failed to update receivable:', error);
    return NextResponse.json({ error: 'Failed to update receivable' }, { status: 400 });
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
    return NextResponse.json({ error: 'Receivable id is required' }, { status: 400 });
  }

  const [existing] = await db
    .select({
      id: financeReceivables.id,
      incomeTransactionId: financeReceivables.incomeTransactionId,
    })
    .from(financeReceivables)
    .where(and(eq(financeReceivables.id, id), eq(financeReceivables.userId, session.user.id)))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: 'Receivable not found' }, { status: 404 });
  }

  await db
    .delete(financeReceivables)
    .where(and(eq(financeReceivables.id, id), eq(financeReceivables.userId, session.user.id)));

  await deleteLinkedIncomeTransaction(session.user.id, existing.incomeTransactionId);

  return NextResponse.json({ success: true }, { status: 200 });
}
