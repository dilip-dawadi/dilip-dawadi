import { and, eq, gte, inArray, lt } from 'drizzle-orm';
import { db } from '@/db';
import { financeSettings, financeTransactions, pushSubscriptions, users } from '@/db/schema';
import { sendEmail } from '@/lib/gmail';
import { sendPushNotification } from '@/lib/push';

interface FinanceAlertDispatchResult {
  scannedUsers: number;
  notifiedUsers: number;
  emailSent: number;
  pushSent: number;
  skipped: number;
  failedToDispatch: number;
}

interface FinanceAlertMessage {
  level: 'info' | 'warning' | 'critical';
  message: string;
}

function monthRange(now: Date): { start: Date; end: Date; key: string } {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const key = `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, '0')}`;
  return { start, end, key };
}

function sameUtcDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

function toCurrency(cents: number): string {
  return (cents / 100).toFixed(2);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export async function dispatchFinanceAlerts(): Promise<FinanceAlertDispatchResult> {
  const now = new Date();
  const { start, end, key } = monthRange(now);

  const candidates = await db
    .select({
      userId: financeSettings.userId,
      monthlyLimitCents: financeSettings.monthlyLimitCents,
      dailyLimitCents: financeSettings.dailyLimitCents,
      monthlySavingsTargetCents: financeSettings.monthlySavingsTargetCents,
      notifyThresholdPercent: financeSettings.notifyThresholdPercent,
      smartAlertsEnabled: financeSettings.smartAlertsEnabled,
      emailAlertsEnabled: financeSettings.emailAlertsEnabled,
      pushAlertsEnabled: financeSettings.pushAlertsEnabled,
      lastAlertSentAt: financeSettings.lastAlertSentAt,
      email: users.email,
      name: users.name,
    })
    .from(financeSettings)
    .innerJoin(users, eq(users.id, financeSettings.userId))
    .where(eq(financeSettings.smartAlertsEnabled, true));

  if (candidates.length === 0) {
    return {
      scannedUsers: 0,
      notifiedUsers: 0,
      emailSent: 0,
      pushSent: 0,
      skipped: 0,
      failedToDispatch: 0,
    };
  }

  const userIds = candidates.map((item) => item.userId);

  const allSubscriptions = await db
    .select({
      id: pushSubscriptions.id,
      userId: pushSubscriptions.userId,
      endpoint: pushSubscriptions.endpoint,
      keys: pushSubscriptions.keys,
    })
    .from(pushSubscriptions)
    .where(inArray(pushSubscriptions.userId, userIds));

  const subscriptionsByUser = new Map<string, typeof allSubscriptions>();
  for (const sub of allSubscriptions) {
    const list = subscriptionsByUser.get(sub.userId) || [];
    list.push(sub);
    subscriptionsByUser.set(sub.userId, list);
  }

  let notifiedUsers = 0;
  let emailSent = 0;
  let pushSent = 0;
  let skipped = 0;
  let failedToDispatch = 0;
  const staleSubscriptionIds = new Set<string>();

  for (const user of candidates) {
    if (!user.emailAlertsEnabled && !user.pushAlertsEnabled) {
      skipped += 1;
      continue;
    }

    if (user.lastAlertSentAt && sameUtcDay(user.lastAlertSentAt, now)) {
      skipped += 1;
      continue;
    }

    const transactions = await db
      .select({
        type: financeTransactions.type,
        amountCents: financeTransactions.amountCents,
        category: financeTransactions.category,
        happenedAt: financeTransactions.happenedAt,
      })
      .from(financeTransactions)
      .where(
        and(
          eq(financeTransactions.userId, user.userId),
          gte(financeTransactions.happenedAt, start),
          lt(financeTransactions.happenedAt, end),
        ),
      );

    if (transactions.length === 0) {
      skipped += 1;
      continue;
    }

    let incomeCents = 0;
    let expenseCents = 0;
    const categoryTotals = new Map<string, number>();
    const dayTotals = new Map<string, number>();

    for (const tx of transactions) {
      if (tx.type === 'income') {
        incomeCents += tx.amountCents;
      } else {
        expenseCents += tx.amountCents;
        categoryTotals.set(tx.category, (categoryTotals.get(tx.category) || 0) + tx.amountCents);

        const dayKey = tx.happenedAt.toISOString().slice(0, 10);
        dayTotals.set(dayKey, (dayTotals.get(dayKey) || 0) + tx.amountCents);
      }
    }

    const netCents = incomeCents - expenseCents;
    const alerts: FinanceAlertMessage[] = [];

    if (user.monthlyLimitCents > 0) {
      const usedPercent = Math.round((expenseCents / user.monthlyLimitCents) * 100);
      if (usedPercent >= 100) {
        alerts.push({
          level: 'critical',
          message: `You exceeded your monthly limit by ${toCurrency(expenseCents - user.monthlyLimitCents)}.`,
        });
      } else if (usedPercent >= user.notifyThresholdPercent) {
        alerts.push({
          level: 'warning',
          message: `You already used ${usedPercent}% of your monthly spending limit.`,
        });
      }
    }

    if (user.monthlySavingsTargetCents > 0 && netCents < user.monthlySavingsTargetCents) {
      alerts.push({
        level: 'info',
        message: `You are ${toCurrency(user.monthlySavingsTargetCents - netCents)} away from this month's savings target.`,
      });
    }

    if (user.dailyLimitCents > 0) {
      const todayKey = now.toISOString().slice(0, 10);
      const todayExpense = dayTotals.get(todayKey) || 0;
      if (todayExpense > user.dailyLimitCents) {
        alerts.push({
          level: 'warning',
          message: `Today you exceeded daily limit by ${toCurrency(todayExpense - user.dailyLimitCents)}.`,
        });
      }
    }

    const topCategory = Array.from(categoryTotals.entries()).sort((a, b) => b[1] - a[1])[0];
    const topAlert = alerts.find((a) => a.level === 'critical') || alerts[0];

    let emailOk = !user.emailAlertsEnabled;
    let pushOk = !user.pushAlertsEnabled;

    if (user.emailAlertsEnabled && user.email) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
      const subject = `Finance Tracker: ${alerts.length > 0 ? 'Money alert' : 'Daily summary'} (${key})`;

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
          <h2 style="margin-bottom: 8px;">Finance Tracker Pulse</h2>
          <p style="margin-bottom: 14px;">Hi ${escapeHtml(user.name || 'there')}, here's your daily money snapshot.</p>

          <div style="border: 1px solid #d9dde6; border-radius: 8px; padding: 14px; background: #f9fbff;">
            <p><strong>Month:</strong> ${key}</p>
            <p><strong>Income:</strong> ${toCurrency(incomeCents)}</p>
            <p><strong>Expense:</strong> ${toCurrency(expenseCents)}</p>
            <p><strong>Net:</strong> ${toCurrency(netCents)}</p>
            ${topCategory ? `<p><strong>Top Category:</strong> ${escapeHtml(topCategory[0])} (${toCurrency(topCategory[1])})</p>` : ''}
          </div>

          ${
            alerts.length > 0
              ? `<p style="margin-top: 14px;"><strong>Alerts:</strong></p><ul>${alerts
                  .map((alert) => `<li>${escapeHtml(alert.message)}</li>`)
                  .join('')}</ul>`
              : '<p style="margin-top: 14px;">No critical money alerts today. Keep it up.</p>'
          }

          <p style="margin-top: 14px;">Open tracker: <a href="${appUrl}/admin/dashboard/planner">${appUrl}/admin/dashboard/planner</a></p>
        </div>
      `;

      emailOk = await sendEmail({
        to: user.email,
        subject,
        text: `Finance summary ${key}\nIncome: ${toCurrency(incomeCents)}\nExpense: ${toCurrency(expenseCents)}\nNet: ${toCurrency(netCents)}\n${topAlert ? `Alert: ${topAlert.message}` : 'No alerts today.'}`,
        html,
      });

      if (emailOk) {
        emailSent += 1;
      }
    }

    if (user.pushAlertsEnabled) {
      const subs = subscriptionsByUser.get(user.userId) || [];
      if (subs.length > 0) {
        const payloadBody = topAlert
          ? topAlert.message
          : `Net ${toCurrency(netCents)} this month. Keep saving.`;

        const pushResults = await Promise.all(
          subs.map((sub) =>
            sendPushNotification(
              {
                endpoint: sub.endpoint,
                keys: sub.keys as { p256dh: string; auth: string },
              },
              {
                title: 'Finance Tracker Daily Pulse',
                body: payloadBody,
                tag: `finance-alert-${user.userId}`,
                url: '/admin/dashboard/planner',
              },
            ).then((result) => ({ ...result, subscriptionId: sub.id })),
          ),
        );

        pushOk = pushResults.some((result) => result.ok);
        if (pushOk) {
          pushSent += 1;
        }

        for (const result of pushResults) {
          if (result.expired) {
            staleSubscriptionIds.add(result.subscriptionId);
          }
        }
      } else {
        // No push subscription exists for this user yet, so don't block email delivery.
        pushOk = true;
      }
    }

    if (emailOk && pushOk) {
      await db
        .update(financeSettings)
        .set({
          lastAlertSentAt: now,
          updatedAt: now,
        })
        .where(eq(financeSettings.userId, user.userId));

      notifiedUsers += 1;
    } else {
      failedToDispatch += 1;
    }
  }

  if (staleSubscriptionIds.size > 0) {
    await db
      .delete(pushSubscriptions)
      .where(inArray(pushSubscriptions.id, Array.from(staleSubscriptionIds)));
  }

  return {
    scannedUsers: candidates.length,
    notifiedUsers,
    emailSent,
    pushSent,
    skipped,
    failedToDispatch,
  };
}
