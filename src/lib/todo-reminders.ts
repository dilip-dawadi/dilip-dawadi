import { and, eq, inArray, isNotNull, lte, ne } from 'drizzle-orm';
import { db } from '@/db';
import { pushSubscriptions, todos, users } from '@/db/schema';
import { sendEmail } from '@/lib/gmail';
import { sendPushNotification } from '@/lib/push';

interface ReminderDispatchResult {
  scanned: number;
  notified: number;
  emailSent: number;
  pushSent: number;
}

type RecurrenceType = 'once' | 'daily' | 'weekly' | 'every-n-days';

function priorityLabel(priority: string): string {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

function recurrenceLabel(recurrence: RecurrenceType, repeatEveryDays: number): string {
  if (recurrence === 'daily') return 'Daily';
  if (recurrence === 'weekly') return 'Weekly';
  if (recurrence === 'every-n-days') return `Every ${repeatEveryDays} days`;
  return 'One-time';
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function getNextReminderDate(
  recurrence: RecurrenceType,
  remindAt: Date | null,
  now: Date,
  repeatEveryDays: number,
): Date | null {
  if (!remindAt || recurrence === 'once') {
    return null;
  }

  const next = new Date(remindAt);
  const stepDays = recurrence === 'daily' ? 1 : recurrence === 'weekly' ? 7 : repeatEveryDays;

  while (next <= now) {
    next.setDate(next.getDate() + stepDays);
  }

  return next;
}

export async function dispatchDueTodoReminders(): Promise<ReminderDispatchResult> {
  const now = new Date();

  const dueTodos = await db
    .select({
      id: todos.id,
      userId: todos.userId,
      title: todos.title,
      description: todos.description,
      priority: todos.priority,
      recurrence: todos.recurrence,
      repeatEveryDays: todos.repeatEveryDays,
      remindAt: todos.remindAt,
      emailReminder: todos.emailReminder,
      pushReminder: todos.pushReminder,
      email: users.email,
      name: users.name,
    })
    .from(todos)
    .innerJoin(users, eq(users.id, todos.userId))
    .where(and(isNotNull(todos.remindAt), lte(todos.remindAt, now), ne(todos.status, 'done')));

  if (dueTodos.length === 0) {
    return { scanned: 0, notified: 0, emailSent: 0, pushSent: 0 };
  }

  const userIds = [...new Set(dueTodos.map((todo) => todo.userId))];

  const subscriptions = await db
    .select({
      id: pushSubscriptions.id,
      userId: pushSubscriptions.userId,
      endpoint: pushSubscriptions.endpoint,
      keys: pushSubscriptions.keys,
    })
    .from(pushSubscriptions)
    .where(inArray(pushSubscriptions.userId, userIds));

  const subscriptionsByUser = new Map<string, typeof subscriptions>();
  for (const sub of subscriptions) {
    const list = subscriptionsByUser.get(sub.userId) || [];
    list.push(sub);
    subscriptionsByUser.set(sub.userId, list);
  }

  let notified = 0;
  let emailSent = 0;
  let pushSent = 0;
  const staleSubscriptionIds = new Set<string>();

  const todosByUser = new Map<string, typeof dueTodos>();
  for (const todo of dueTodos) {
    const list = todosByUser.get(todo.userId) || [];
    list.push(todo);
    todosByUser.set(todo.userId, list);
  }

  for (const [userId, userTodos] of todosByUser.entries()) {
    const userEmail = userTodos[0]?.email;
    const userName = userTodos[0]?.name || 'there';

    const emailTodos = userTodos.filter((todo) => todo.emailReminder);
    const pushTodos = userTodos.filter((todo) => todo.pushReminder);

    let emailBatchOk = false;
    let pushBatchOk = false;

    if (emailTodos.length > 0 && userEmail) {
      const taskItemsHtml = emailTodos
        .map(
          (todo) => `
          <li style="margin-bottom: 10px;">
            <strong>${escapeHtml(todo.title)}</strong><br />
            Priority: ${priorityLabel(todo.priority)}<br />
            Repeat: ${recurrenceLabel(todo.recurrence as RecurrenceType, todo.repeatEveryDays)}<br />
            ${todo.description ? `Details: ${escapeHtml(todo.description)}` : ''}
          </li>
        `,
        )
        .join('');

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
      const subject = `Life Planner: ${emailTodos.length} reminder${emailTodos.length > 1 ? 's' : ''} due today`;

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
          <h2 style="margin-bottom: 8px;">Daily Life Reminder Summary</h2>
          <p style="margin-bottom: 16px;">Hi ${escapeHtml(userName)}, here are your due tasks.</p>

          <div style="border: 1px solid #d9dde6; border-radius: 8px; padding: 16px; background: #f9fbff;">
            <ul style="padding-left: 18px; margin: 0;">${taskItemsHtml}</ul>
          </div>

          <p style="margin-top: 16px;">
            Open your planner: <a href="${appUrl}/admin/dashboard/todo">${appUrl}/admin/dashboard/todo</a>
          </p>
        </div>
      `;

      const textLines = emailTodos.map(
        (todo, index) =>
          `${index + 1}. ${todo.title} (${priorityLabel(todo.priority)}, ${recurrenceLabel(todo.recurrence as RecurrenceType, todo.repeatEveryDays)})`,
      );

      emailBatchOk = await sendEmail({
        to: userEmail,
        subject,
        text: `Daily summary:\n${textLines.join('\n')}`,
        html,
      });

      if (emailBatchOk) {
        emailSent += 1;
      }
    }

    if (pushTodos.length > 0) {
      const userSubs = subscriptionsByUser.get(userId) || [];

      if (userSubs.length > 0) {
        const previewTitles = pushTodos
          .slice(0, 2)
          .map((todo) => todo.title)
          .join(' | ');

        const pushResults = await Promise.all(
          userSubs.map((sub) =>
            sendPushNotification(
              {
                endpoint: sub.endpoint,
                keys: sub.keys as { p256dh: string; auth: string },
              },
              {
                title: `You have ${pushTodos.length} due task${pushTodos.length > 1 ? 's' : ''}`,
                body: previewTitles || 'Open planner to review your tasks.',
                tag: `todo-summary-${userId}`,
                url: '/admin/dashboard/todo',
              },
            ).then((result) => ({ ...result, subscriptionId: sub.id })),
          ),
        );

        pushBatchOk = pushResults.some((result) => result.ok);

        if (pushBatchOk) {
          pushSent += 1;
        }

        for (const result of pushResults) {
          if (result.expired) {
            staleSubscriptionIds.add(result.subscriptionId);
          }
        }
      }
    }

    for (const todo of userTodos) {
      const emailOk = !todo.emailReminder || emailBatchOk;
      const pushOk = !todo.pushReminder || pushBatchOk;

      if (emailOk || pushOk) {
        const nextReminderAt = getNextReminderDate(
          todo.recurrence as RecurrenceType,
          todo.remindAt,
          now,
          todo.repeatEveryDays,
        );

        await db
          .update(todos)
          .set({
            remindAt: nextReminderAt,
            reminderSentAt: now,
            updatedAt: now,
          })
          .where(eq(todos.id, todo.id));

        notified += 1;
      }
    }
  }

  if (staleSubscriptionIds.size > 0) {
    await db
      .delete(pushSubscriptions)
      .where(inArray(pushSubscriptions.id, Array.from(staleSubscriptionIds)));
  }

  return {
    scanned: dueTodos.length,
    notified,
    emailSent,
    pushSent,
  };
}
