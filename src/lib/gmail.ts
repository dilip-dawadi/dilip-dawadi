/**
 * Gmail API service for sending email notifications
 */

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Refresh the access token using the refresh token
 */
async function refreshAccessToken(): Promise<string> {
  const tokenEndpoint = 'https://oauth2.googleapis.com/token';

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: process.env.GMAIL_REFRESH_TOKEN!,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('❌ Token refresh failed:', errorData);

    // Check for specific error types
    if (errorData.error === 'invalid_grant') {
      console.error('⚠️  Refresh token expired! Regenerate with: npm run gmail:token');
      console.error('📖 See: docs/FIX_TOKEN_EXPIRY.md for help');
      throw new Error('Refresh token expired or revoked. Run: npm run gmail:token');
    }

    throw new Error(`Failed to refresh token: ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Create a raw email message for Gmail API
 */
function createRawMessage(options: EmailOptions): string {
  const { to, subject, text, html } = options;
  const from = process.env.GMAIL_FROM_EMAIL || process.env.GMAIL_USER_EMAIL!;

  const messageParts = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    '',
    html || text,
  ];

  const message = messageParts.join('\n');

  // Base64url encode the message
  const encodedMessage = Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return encodedMessage;
}

/**
 * Send email using Gmail API
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // Get a fresh access token
    const accessToken = await refreshAccessToken();

    // Create the raw message
    const rawMessage = createRawMessage(options);

    // Send the email using Gmail API
    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: rawMessage,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to send email:', error);
      return false;
    }

    console.log('✅ Email sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Event severity levels
 */
export enum EventSeverity {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
}

interface CriticalEventInfo {
  eventType: string;
  severity: EventSeverity;
  message: string;
  timestamp: Date;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Get color scheme based on severity
 */
function getSeverityColors(severity: EventSeverity): {
  bg: string;
  border: string;
  text: string;
  emoji: string;
} {
  switch (severity) {
    case EventSeverity.CRITICAL:
      return { bg: '#dc2626', border: '#991b1b', text: '#991b1b', emoji: '🚨' };
    case EventSeverity.HIGH:
      return { bg: '#ea580c', border: '#c2410c', text: '#c2410c', emoji: '⚠️' };
    case EventSeverity.MEDIUM:
      return { bg: '#fbbf24', border: '#d97706', text: '#92400e', emoji: '⚡' };
    default:
      return { bg: '#fbbf24', border: '#d97706', text: '#92400e', emoji: '⚡' };
  }
}

/**
 * Send critical event notification email
 */
export async function sendCriticalEventNotification(
  eventInfo: CriticalEventInfo,
): Promise<boolean> {
  const { eventType, severity, message, timestamp, details, ipAddress, userAgent } = eventInfo;
  const colors = getSeverityColors(severity);
  const adminEmail = process.env.ADMIN_EMAIL || process.env.GMAIL_USER_EMAIL!;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body { 
          font-family: 'Source Sans Pro', 'Helvetica Neue', Helvetica, Arial, sans-serif;
          line-height: 1.7;
          color: #1d1d1f;
          background-color: #f5f5f7;
          padding: 20px;
        }
        .container { 
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
        }
        .header { 
          background: ${colors.bg};
          color: #ffffff;
          padding: 32px 24px;
          text-align: center;
        }
        .header h1 { 
          font-family: 'Raleway', 'Helvetica Neue', Helvetica, Arial, sans-serif;
          font-size: 24px;
          font-weight: 700;
          margin: 0;
          letter-spacing: 0.01em;
        }
        .header .emoji {
          font-size: 48px;
          margin-bottom: 12px;
          display: block;
        }
        .severity-badge {
          display: inline-block;
          padding: 6px 16px;
          background-color: rgba(255, 255, 255, 0.2);
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
          margin-top: 8px;
        }
        .content { 
          padding: 32px 24px;
        }
        .content p {
          margin-bottom: 24px;
          color: #58585d;
          font-size: 15px;
        }
        .alert-message {
          background-color: #fef2f2;
          border-left: 4px solid ${colors.border};
          border-radius: 4px;
          padding: 20px;
          margin-bottom: 24px;
        }
        .alert-message p {
          margin: 0;
          color: ${colors.text};
          font-size: 16px;
          font-weight: 600;
        }
        .info-section {
          background-color: #f5f5f7;
          border-radius: 6px;
          padding: 20px;
          margin-bottom: 20px;
        }
        .info-row { 
          padding: 12px 0;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        }
        .info-row:last-child {
          border-bottom: none;
        }
        .label { 
          font-weight: 600;
          color: #1d1d1f;
          display: inline-block;
          min-width: 140px;
          font-size: 14px;
        }
        .value {
          color: #58585d;
          font-size: 14px;
          word-break: break-word;
        }
        .footer { 
          padding: 24px;
          text-align: center;
          background-color: #f5f5f7;
          border-top: 1px solid rgba(0, 0, 0, 0.06);
        }
        .footer p {
          font-size: 12px;
          color: #58585d;
          margin: 0;
        }
        .footer a {
          color: #2e59ba;
          text-decoration: none;
        }
        .footer a:hover {
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <span class="emoji">${colors.emoji}</span>
          <h1>Security Alert</h1>
          <span class="severity-badge">${severity} PRIORITY</span>
        </div>
        <div class="content">
          <div class="alert-message">
            <p>${message}</p>
          </div>
          
          <div class="info-section">
            <div class="info-row">
              <span class="label">Event Type:</span>
              <span class="value">${eventType}</span>
            </div>
            
            <div class="info-row">
              <span class="label">Severity:</span>
              <span class="value">${severity}</span>
            </div>
            
            <div class="info-row">
              <span class="label">Timestamp:</span>
              <span class="value">${timestamp.toLocaleString('en-US', {
                dateStyle: 'full',
                timeStyle: 'long',
              })}</span>
            </div>
            
            ${
              ipAddress
                ? `
            <div class="info-row">
              <span class="label">IP Address:</span>
              <span class="value">${ipAddress}</span>
            </div>
            `
                : ''
            }
            
            ${
              userAgent
                ? `
            <div class="info-row">
              <span class="label">User Agent:</span>
              <span class="value">${userAgent}</span>
            </div>
            `
                : ''
            }
            
            ${
              details && Object.keys(details).length > 0
                ? Object.entries(details)
                    .map(
                      ([key, value]) => `
            <div class="info-row">
              <span class="label">${key.charAt(0).toUpperCase() + key.slice(1)}:</span>
              <span class="value">${typeof value === 'object' ? JSON.stringify(value) : value}</span>
            </div>
            `,
                    )
                    .join('')
                : ''
            }
          </div>
          
          <p style="font-size: 14px; color: #58585d; margin-top: 20px;">
            ${severity === EventSeverity.CRITICAL ? '🛡️ <strong>Action Required:</strong> Please review this incident immediately and take appropriate security measures.' : 'Please review and monitor your website for any suspicious activity.'}
          </p>
        </div>
        <div class="footer">
          <p>This is an automated security notification from <a href="https://dilipdawadi.com.np">dilipdawadi.com.np</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
🚨 SECURITY ALERT - ${severity} PRIORITY

${message}

Event Type: ${eventType}
Severity: ${severity}
Timestamp: ${timestamp.toLocaleString()}
${ipAddress ? `IP Address: ${ipAddress}` : ''}
${userAgent ? `User Agent: ${userAgent}` : ''}
${
  details && Object.keys(details).length > 0
    ? `\nAdditional Details:\n${Object.entries(details)
        .map(
          ([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`,
        )
        .join('\n')}`
    : ''
}

Please review this incident immediately.
  `;

  return sendEmail({
    to: adminEmail,
    subject: `🚨 [${severity}] ${eventType} - Security Alert`,
    text,
    html,
  });
}

/**
 * Helper functions for common critical events
 */
export async function notifyUnauthorizedAccess(details: {
  path: string;
  ipAddress?: string;
  userAgent?: string;
  attemptedAction?: string;
}): Promise<boolean> {
  return sendCriticalEventNotification({
    eventType: 'Unauthorized Access Attempt',
    severity: EventSeverity.HIGH,
    message: `Someone attempted to access a protected resource without proper authorization.`,
    timestamp: new Date(),
    details: {
      path: details.path,
      attemptedAction: details.attemptedAction || 'Access protected resource',
    },
    ipAddress: details.ipAddress,
    userAgent: details.userAgent,
  });
}

export async function notifyFailedLoginAttempts(details: {
  email: string;
  attemptCount: number;
  ipAddress?: string;
  userAgent?: string;
}): Promise<boolean> {
  return sendCriticalEventNotification({
    eventType: 'Multiple Failed Login Attempts',
    severity: EventSeverity.HIGH,
    message: `Multiple failed login attempts detected for account: ${details.email}`,
    timestamp: new Date(),
    details: {
      email: details.email,
      attemptCount: details.attemptCount,
      possibleBruteForce: details.attemptCount > 5 ? 'Yes' : 'No',
    },
    ipAddress: details.ipAddress,
    userAgent: details.userAgent,
  });
}

export async function notifyDatabaseError(details: {
  operation: string;
  error: string;
  table?: string;
}): Promise<boolean> {
  return sendCriticalEventNotification({
    eventType: 'Database Error',
    severity: EventSeverity.CRITICAL,
    message: `A critical database error occurred during ${details.operation}`,
    timestamp: new Date(),
    details: {
      operation: details.operation,
      table: details.table || 'N/A',
      error: details.error,
    },
  });
}

export async function notifySystemError(details: {
  component: string;
  error: string;
  severity?: EventSeverity;
}): Promise<boolean> {
  return sendCriticalEventNotification({
    eventType: 'System Error',
    severity: details.severity || EventSeverity.MEDIUM,
    message: `System error in ${details.component}`,
    timestamp: new Date(),
    details: {
      component: details.component,
      error: details.error,
    },
  });
}
