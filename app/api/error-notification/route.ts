import { NextRequest, NextResponse } from 'next/server';
import { notifySystemError, EventSeverity } from '@/lib/gmail';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { error, digest, stack, timestamp, userAgent, url, critical } = body;

    const ip =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    // Non-critical UI/runtime errors should not be treated as high-priority security incidents.
    const severity = critical ? EventSeverity.CRITICAL : EventSeverity.MEDIUM;

    // Send notification to admin
    await notifySystemError({
      component: critical ? 'Application Root' : url || 'Application',
      error: error || 'Unknown error',
      severity,
    });

    // Log detailed error information
    console.error('Error notification sent:', {
      error,
      digest,
      stack: stack?.substring(0, 500), // Truncate stack for logging
      timestamp,
      userAgent,
      url,
      ip,
      critical,
    });

    return NextResponse.json({ success: true, notified: true });
  } catch (notifyError) {
    console.error('Failed to send error notification:', notifyError);
    // Don't fail the request if notification fails
    return NextResponse.json(
      { success: false, error: 'Failed to send notification' },
      { status: 500 },
    );
  }
}
