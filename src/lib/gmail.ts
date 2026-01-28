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
      client_secret: process.env.GMAIL_CLIENT_SECRET!,
      refresh_token: process.env.GMAIL_REFRESH_TOKEN!,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
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
 * Send login notification email
 */
export async function sendLoginNotification(userInfo: {
  email: string;
  name?: string;
  loginTime: Date;
  ipAddress?: string;
  userAgent?: string;
}): Promise<boolean> {
  const { email, name, loginTime, ipAddress, userAgent } = userInfo;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4285f4; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
        .info-row { margin: 10px 0; padding: 10px; background: white; border-radius: 3px; }
        .label { font-weight: bold; color: #555; }
        .footer { margin-top: 20px; font-size: 12px; color: #777; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>🔔 New Login Detected</h2>
        </div>
        <div class="content">
          <p>A new login was detected on your website:</p>
          
          <div class="info-row">
            <span class="label">User:</span> ${name || 'N/A'}
          </div>
          
          <div class="info-row">
            <span class="label">Email:</span> ${email}
          </div>
          
          <div class="info-row">
            <span class="label">Login Time:</span> ${loginTime.toLocaleString('en-US', {
              dateStyle: 'full',
              timeStyle: 'long',
            })}
          </div>
          
          ${
            ipAddress
              ? `
          <div class="info-row">
            <span class="label">IP Address:</span> ${ipAddress}
          </div>
          `
              : ''
          }
          
          ${
            userAgent
              ? `
          <div class="info-row">
            <span class="label">Browser/Device:</span> ${userAgent}
          </div>
          `
              : ''
          }
          
          <p style="margin-top: 20px; padding: 15px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 3px;">
            ⚠️ If this wasn't you or you don't recognize this activity, please check your account security settings immediately.
          </p>
        </div>
        <div class="footer">
          <p>This is an automated notification from dilipdawadi.com.np</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
New Login Detected

User: ${name || 'N/A'}
Email: ${email}
Login Time: ${loginTime.toLocaleString()}
${ipAddress ? `IP Address: ${ipAddress}` : ''}
${userAgent ? `Browser/Device: ${userAgent}` : ''}

If this wasn't you, please check your account security immediately.
  `;

  return sendEmail({
    to: email,
    subject: `New Login Alert - ${loginTime.toLocaleDateString()}`,
    text,
    html,
  });
}
