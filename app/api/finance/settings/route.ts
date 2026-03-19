import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { financeSettings } from '@/db/schema';
import { auth } from '@/lib/auth';
import { financeSettingsSchema } from '@/lib/validations';

const defaultSettings = {
  monthlyLimitCents: 0,
  dailyLimitCents: 0,
  monthlySavingsTargetCents: 0,
  notifyThresholdPercent: 80,
  smartAlertsEnabled: true,
  emailAlertsEnabled: true,
  pushAlertsEnabled: true,
};

export async function GET() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [settings] = await db
    .select()
    .from(financeSettings)
    .where(eq(financeSettings.userId, session.user.id))
    .limit(1);

  return NextResponse.json(settings || defaultSettings, { status: 200 });
}

export async function PUT(request: Request) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = financeSettingsSchema.parse(body);

    const [existing] = await db
      .select({ id: financeSettings.id })
      .from(financeSettings)
      .where(eq(financeSettings.userId, session.user.id))
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(financeSettings)
        .set({
          monthlyLimitCents: parsed.monthlyLimitCents,
          dailyLimitCents: parsed.dailyLimitCents,
          monthlySavingsTargetCents: parsed.monthlySavingsTargetCents,
          notifyThresholdPercent: parsed.notifyThresholdPercent,
          smartAlertsEnabled: parsed.smartAlertsEnabled,
          emailAlertsEnabled: parsed.emailAlertsEnabled,
          pushAlertsEnabled: parsed.pushAlertsEnabled,
          updatedAt: new Date(),
        })
        .where(eq(financeSettings.userId, session.user.id))
        .returning();

      return NextResponse.json(updated, { status: 200 });
    }

    const [created] = await db
      .insert(financeSettings)
      .values({
        userId: session.user.id,
        monthlyLimitCents: parsed.monthlyLimitCents,
        dailyLimitCents: parsed.dailyLimitCents,
        monthlySavingsTargetCents: parsed.monthlySavingsTargetCents,
        notifyThresholdPercent: parsed.notifyThresholdPercent,
        smartAlertsEnabled: parsed.smartAlertsEnabled,
        emailAlertsEnabled: parsed.emailAlertsEnabled,
        pushAlertsEnabled: parsed.pushAlertsEnabled,
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Failed to save finance settings:', error);
    return NextResponse.json({ error: 'Failed to save finance settings' }, { status: 400 });
  }
}
