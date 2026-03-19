import { and, eq, inArray } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { financeReceivables, financeTransactions } from '@/db/schema';
import { auth } from '@/lib/auth';
import { financeReceivableBulkPaySchema } from '@/lib/validations';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = financeReceivableBulkPaySchema.parse(body);

    const records = await db
      .select()
      .from(financeReceivables)
      .where(
        and(
          eq(financeReceivables.userId, session.user.id),
          inArray(financeReceivables.id, parsed.ids),
          eq(financeReceivables.status, 'pending'),
        ),
      );

    if (records.length === 0) {
      return NextResponse.json({ updated: 0 }, { status: 200 });
    }

    const now = new Date();

    for (const receivable of records) {
      const [tx] = await db
        .insert(financeTransactions)
        .values({
          userId: session.user.id,
          type: 'income',
          amountCents: receivable.amountCents,
          category: receivable.category,
          note: receivable.note || `Receivable paid: ${receivable.title} (${receivable.payerName})`,
          happenedAt: now,
          isRecurring: false,
          recurringInterval: null,
        })
        .returning({ id: financeTransactions.id });

      await db
        .update(financeReceivables)
        .set({
          status: 'paid',
          paidAt: now,
          incomeTransactionId: tx.id,
          updatedAt: now,
        })
        .where(
          and(
            eq(financeReceivables.id, receivable.id),
            eq(financeReceivables.userId, session.user.id),
          ),
        );
    }

    return NextResponse.json({ updated: records.length }, { status: 200 });
  } catch (error) {
    console.error('Failed bulk pay receivables:', error);
    return NextResponse.json({ error: 'Failed to mark receivables as paid' }, { status: 400 });
  }
}
