import { and, asc, eq, gte, lt } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { financeSettings, financeTransactions } from '@/db/schema';
import { auth } from '@/lib/auth';

interface DaySummary {
  date: string;
  incomeCents: number;
  expenseCents: number;
  netCents: number;
}

function toMonthRange(month: string | null): { start: Date; end: Date; key: string } {
  const now = new Date();
  const monthKey =
    month || `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  const start = new Date(`${monthKey}-01T00:00:00.000Z`);

  if (Number.isNaN(start.getTime())) {
    const fallbackStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const fallbackEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    return {
      start: fallbackStart,
      end: fallbackEnd,
      key: `${fallbackStart.getUTCFullYear()}-${String(fallbackStart.getUTCMonth() + 1).padStart(2, '0')}`,
    };
  }

  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + 1);

  return { start, end, key: monthKey };
}

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month');
  const { start, end, key } = toMonthRange(month);

  const [settings] = await db
    .select()
    .from(financeSettings)
    .where(eq(financeSettings.userId, session.user.id))
    .limit(1);

  const transactions = await db
    .select()
    .from(financeTransactions)
    .where(
      and(
        eq(financeTransactions.userId, session.user.id),
        gte(financeTransactions.happenedAt, start),
        lt(financeTransactions.happenedAt, end),
      ),
    )
    .orderBy(asc(financeTransactions.happenedAt));

  let incomeCents = 0;
  let expenseCents = 0;

  const categoryMap = new Map<string, number>();
  const dailyMap = new Map<string, DaySummary>();

  for (const tx of transactions) {
    const amount = tx.amountCents;
    const dateKey = tx.happenedAt.toISOString().slice(0, 10);
    const currentDay = dailyMap.get(dateKey) || {
      date: dateKey,
      incomeCents: 0,
      expenseCents: 0,
      netCents: 0,
    };

    if (tx.type === 'income') {
      incomeCents += amount;
      currentDay.incomeCents += amount;
      currentDay.netCents += amount;
    } else {
      expenseCents += amount;
      currentDay.expenseCents += amount;
      currentDay.netCents -= amount;

      const existingCategoryTotal = categoryMap.get(tx.category) || 0;
      categoryMap.set(tx.category, existingCategoryTotal + amount);
    }

    dailyMap.set(dateKey, currentDay);
  }

  const netCents = incomeCents - expenseCents;
  const savingsRatePercent = incomeCents > 0 ? Math.round((netCents / incomeCents) * 100) : 0;

  const byCategory = Array.from(categoryMap.entries())
    .map(([category, value]) => ({ category, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const daysPassed = Math.max(1, Math.ceil((Date.now() - start.getTime()) / (24 * 60 * 60 * 1000)));
  const projectedMonthlyExpenseCents = Math.round((expenseCents / daysPassed) * 30);

  const monthlyLimitCents = settings?.monthlyLimitCents || 0;
  const dailyLimitCents = settings?.dailyLimitCents || 0;
  const savingsTargetCents = settings?.monthlySavingsTargetCents || 0;
  const thresholdPercent = settings?.notifyThresholdPercent || 80;

  const alerts: Array<{ level: 'info' | 'warning' | 'critical'; message: string }> = [];

  if (settings?.smartAlertsEnabled) {
    if (monthlyLimitCents > 0) {
      const usedPercent = Math.round((expenseCents / monthlyLimitCents) * 100);
      if (usedPercent >= 100) {
        alerts.push({
          level: 'critical',
          message: `You exceeded your monthly limit by ${((expenseCents - monthlyLimitCents) / 100).toFixed(2)}.`,
        });
      } else if (usedPercent >= thresholdPercent) {
        alerts.push({
          level: 'warning',
          message: `You already used ${usedPercent}% of your monthly limit. Consider cutting variable spending.`,
        });
      }

      if (projectedMonthlyExpenseCents > monthlyLimitCents) {
        alerts.push({
          level: 'warning',
          message: `At your current pace, projected spending is ${(projectedMonthlyExpenseCents / 100).toFixed(2)} this month.`,
        });
      }
    }

    if (savingsTargetCents > 0 && netCents < savingsTargetCents) {
      const gap = ((savingsTargetCents - netCents) / 100).toFixed(2);
      alerts.push({
        level: 'info',
        message: `You are ${gap} away from your savings target this month.`,
      });
    }

    if (dailyLimitCents > 0) {
      const todayKey = new Date().toISOString().slice(0, 10);
      const todayExpenseCents = dailyMap.get(todayKey)?.expenseCents || 0;
      if (todayExpenseCents > dailyLimitCents) {
        alerts.push({
          level: 'warning',
          message: `Today's spending exceeded your daily limit by ${((todayExpenseCents - dailyLimitCents) / 100).toFixed(2)}.`,
        });
      }
    }
  }

  return NextResponse.json(
    {
      month: key,
      totals: {
        incomeCents,
        expenseCents,
        netCents,
        savingsRatePercent,
        transactionCount: transactions.length,
      },
      limits: {
        monthlyLimitCents,
        dailyLimitCents,
        monthlySavingsTargetCents: savingsTargetCents,
        notifyThresholdPercent: thresholdPercent,
        smartAlertsEnabled: settings?.smartAlertsEnabled ?? true,
        emailAlertsEnabled: settings?.emailAlertsEnabled ?? true,
        pushAlertsEnabled: settings?.pushAlertsEnabled ?? true,
      },
      projectedMonthlyExpenseCents,
      byCategory,
      daily: Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date)),
      alerts,
    },
    { status: 200 },
  );
}
