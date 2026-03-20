import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { dispatchDueTodoReminders, dispatchWeeklyTodoSummary } from '@/lib/todo-reminders';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function hasValidCronSecret(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return false;
  }

  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace('Bearer ', '').trim();
  const fallbackHeader = request.headers.get('x-cron-secret');

  return token === cronSecret || fallbackHeader === cronSecret;
}

export async function POST(request: NextRequest) {
  return runReminderDispatch(request);
}

export async function GET(request: NextRequest) {
  return runReminderDispatch(request);
}

async function runReminderDispatch(request: NextRequest) {
  const session = await auth();
  const isAdmin = session?.user?.role === 'admin';
  const authorizedByCron = hasValidCronSecret(request);
  const mode = request.nextUrl.searchParams.get('mode');

  if (!isAdmin && !authorizedByCron) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result =
      mode === 'weekly-summary'
        ? await dispatchWeeklyTodoSummary()
        : await dispatchDueTodoReminders();
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Failed to dispatch todo reminders:', error);
    return NextResponse.json({ error: 'Failed to send reminders' }, { status: 500 });
  }
}
