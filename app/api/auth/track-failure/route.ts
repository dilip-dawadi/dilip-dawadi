import { NextRequest, NextResponse } from 'next/server';
import { notifyFailedLoginAttempts } from '@/lib/gmail';

// In-memory store for failed attempts (in production, use Redis or database)
const failedAttempts = new Map<string, { count: number; lastAttempt: Date }>();

// Clean up old entries every hour
setInterval(
  () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    for (const [key, value] of failedAttempts.entries()) {
      if (value.lastAttempt < oneHourAgo) {
        failedAttempts.delete(key);
      }
    }
  },
  60 * 60 * 1000,
);

export async function POST(request: NextRequest) {
  try {
    const { error } = await request.json();
    const ip =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Track failed attempts per IP
    const key = ip;
    const current = failedAttempts.get(key) || { count: 0, lastAttempt: new Date() };
    current.count += 1;
    current.lastAttempt = new Date();
    failedAttempts.set(key, current);

    console.log(`Failed auth attempt from ${ip}: ${error} (Total: ${current.count})`);

    // Send notification after 3 failed attempts
    if (current.count >= 3) {
      try {
        await notifyFailedLoginAttempts({
          email: `IP: ${ip}`,
          attemptCount: current.count,
          ipAddress: ip,
          userAgent,
        });
        console.log(`Sent notification for ${current.count} failed attempts from ${ip}`);
      } catch (notifyError) {
        console.error('Failed to send notification:', notifyError);
      }
    }

    return NextResponse.json({
      success: true,
      tracked: true,
      attemptCount: current.count,
    });
  } catch (error) {
    console.error('Error tracking auth failure:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to track attempt',
      },
      { status: 500 },
    );
  }
}
