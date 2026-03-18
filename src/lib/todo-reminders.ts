import { and, eq, inArray, isNull, lte, ne } from 'drizzle-orm';
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

function priorityLabel(priority: string): string {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
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
      remindAt: todos.remindAt,
      emailReminder: todos.emailReminder,
      pushReminder: todos.pushReminder,
      email: users.email,
      name: users.name,
    })
    .from(todos)
    .innerJoin(users, eq(users.id, todos.userId))
    .where(
      and(
        isNull(todos.reminderSentAt),
        lte(todos.remindAt, now),
        ne(todos.status, 'done'),
      ),
    );

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

  for (const todo of dueTodos) {
    let emailOk = !todo.emailReminder;
    let pushOk = !todo.pushReminder;

    if (todo.emailReminder && todo.email) {
      const subject = `Reminder: ${todo.title}`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto;">
          <h2 style="margin-bottom: 12px;">Task Reminder</h2>
          <p style="margin-bottom: 16px;">Hi ${todo.name || 'there'}, your task is due now.</p>
          <div style="border: 1px solid #d9dde6; border-radius: 8px; padding: 16px; background: #f9fbff;">
            <p style="margin: 0 0 8px;"><strong>Title:</strong> ${todo.title}</p>
            <p style="margin: 0 0 8px;"><strong>Priority:</strong> ${priorityLabel(todo.priority)}</p>
            <p style="margin: 0;"><strong>Description:</strong> ${todo.description || 'No description provided.'}</p>
          </div>
          <p style="margin-top: 16px;">
            Open your task board: <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/todo">${process.env.NEXT_PUBLIC_APP_URL || ''}/todo</a>
          </p>
        </div>
      `;

      emailOk = await sendEmail({
        to: todo.email,
        subject,
        text: `${todo.title} is due now. Priority: ${todo.priority}.`,
        html,
      });

      if (emailOk) {
        emailSent += 1;
      }
    }

    if (todo.pushReminder) {
      const userSubs = subscriptionsByUser.get(todo.userId) || [];
      if (userSubs.length > 0) {
        const pushResults = await Promise.all(
          userSubs.map((sub) =>
            sendPushNotification(
              {
                endpoint: sub.endpoint,
                keys: sub.keys as { p256dh: string; auth: string },
              },
              {
                title: `Priority: ${priorityLabel(todo.priority)}`,
                body: todo.title,
                tag: `todo-${todo.id}`,
                url: '/todo',
              },
            ).then((result) => ({ ...result, subscriptionId: sub.id })),
          ),
        );

        const successfulPush = pushResults.some((result) => result.ok);
        pushOk = successfulPush;

        if (successfulPush) {
          pushSent += 1;
        }

        for (const result of pushResults) {
          if (result.expired) {
            staleSubscriptionIds.add(result.subscriptionId);
          }
        }
      } else {
        pushOk = false;
      }
    }

    if (emailOk || pushOk) {
      await db
        .update(todos)
        .set({
          reminderSentAt: now,
          updatedAt: now,
        })
        .where(eq(todos.id, todo.id));

      notified += 1;
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
