import { and, desc, eq, gte, lt } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { financeTransactions } from '@/db/schema';
import { auth } from '@/lib/auth';
import { financeTransactionSchema, updateFinanceTransactionSchema } from '@/lib/validations';

function parseTxnDate(value?: string): Date {
  if (!value) {
    return new Date();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month');

  let whereClause = eq(financeTransactions.userId, session.user.id);

  if (month) {
    const start = new Date(`${month}-01T00:00:00.000Z`);
    if (!Number.isNaN(start.getTime())) {
      const end = new Date(start);
      end.setUTCMonth(end.getUTCMonth() + 1);

      whereClause = and(
        eq(financeTransactions.userId, session.user.id),
        gte(financeTransactions.happenedAt, start),
        lt(financeTransactions.happenedAt, end),
      ) as typeof whereClause;
    }
  }

  const result = await db
    .select()
    .from(financeTransactions)
    .where(whereClause)
    .orderBy(desc(financeTransactions.happenedAt), desc(financeTransactions.createdAt));

  return NextResponse.json(result, { status: 200 });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = financeTransactionSchema.parse(body);

    const [created] = await db
      .insert(financeTransactions)
      .values({
        userId: session.user.id,
        type: parsed.type,
        amountCents: parsed.amountCents,
        category: parsed.category.trim(),
        note: parsed.note?.trim() || null,
        happenedAt: parseTxnDate(parsed.happenedAt),
        isRecurring: parsed.isRecurring,
        recurringInterval: parsed.isRecurring ? parsed.recurringInterval || 'monthly' : null,
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Failed to create finance transaction:', error);
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = updateFinanceTransactionSchema.parse(body);

    const [updated] = await db
      .update(financeTransactions)
      .set({
        type: parsed.type,
        amountCents: parsed.amountCents,
        category: parsed.category.trim(),
        note: parsed.note?.trim() || null,
        happenedAt: parseTxnDate(parsed.happenedAt),
        isRecurring: parsed.isRecurring,
        recurringInterval: parsed.isRecurring ? parsed.recurringInterval || 'monthly' : null,
        updatedAt: new Date(),
      })
      .where(
        and(eq(financeTransactions.id, parsed.id), eq(financeTransactions.userId, session.user.id)),
      )
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('Failed to update finance transaction:', error);
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 400 });
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
    return NextResponse.json({ error: 'Transaction id is required' }, { status: 400 });
  }

  const [deleted] = await db
    .delete(financeTransactions)
    .where(and(eq(financeTransactions.id, id), eq(financeTransactions.userId, session.user.id)))
    .returning({ id: financeTransactions.id });

  if (!deleted) {
    return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
