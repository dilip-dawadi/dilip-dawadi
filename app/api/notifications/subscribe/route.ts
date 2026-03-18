import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { pushSubscriptions } from '@/db/schema';
import { auth } from '@/lib/auth';
import { pushSubscriptionSchema } from '@/lib/validations';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const subscription = pushSubscriptionSchema.parse(body);

    await db
      .insert(pushSubscriptions)
      .values({
        userId: session.user.id,
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        userAgent: request.headers.get('user-agent'),
      })
      .onConflictDoUpdate({
        target: pushSubscriptions.endpoint,
        set: {
          userId: session.user.id,
          keys: subscription.keys,
          userAgent: request.headers.get('user-agent'),
          updatedAt: new Date(),
        },
      });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Failed to save push subscription:', error);
    return NextResponse.json(
      { error: 'Invalid subscription payload' },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');

  if (!endpoint) {
    return NextResponse.json(
      { error: 'Endpoint is required' },
      { status: 400 },
    );
  }

  await db
    .delete(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.userId, session.user.id),
        eq(pushSubscriptions.endpoint, endpoint),
      ),
    );

  return NextResponse.json({ success: true }, { status: 200 });
}
