import { and, eq, gte, lt, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { financeWorkLogs } from '@/db/schema';
import { auth } from '@/lib/auth';

function utcDayRange(now = new Date()): { start: Date; end: Date } {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { start, end } = utcDayRange();

  const [aggregate] = await db
    .select({
      totalMinutes: sql<number>`coalesce(sum(${financeWorkLogs.minutesWorked}), 0)`,
      totalIncomeCents: sql<number>`coalesce(sum(round((${financeWorkLogs.minutesWorked}::numeric / 60) * ${financeWorkLogs.hourlyRateCents})), 0)`,
      entries: sql<number>`count(*)`,
    })
    .from(financeWorkLogs)
    .where(
      and(
        eq(financeWorkLogs.userId, session.user.id),
        gte(financeWorkLogs.workDate, start),
        lt(financeWorkLogs.workDate, end),
      ),
    );

  return NextResponse.json(
    {
      date: start.toISOString().slice(0, 10),
      totalMinutes: Number(aggregate?.totalMinutes || 0),
      totalIncomeCents: Number(aggregate?.totalIncomeCents || 0),
      entries: Number(aggregate?.entries || 0),
    },
    { status: 200 },
  );
}
