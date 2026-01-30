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
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .header { 
          background: linear-gradient(135deg, #2e59ba 0%, #60a5fa 100%);
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
          font-size: 32px;
          margin-bottom: 8px;
          display: block;
        }
        .content { 
          padding: 32px 24px;
        }
        .content p {
          margin-bottom: 24px;
          color: #58585d;
          font-size: 15px;
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
        }
        .warning-box {
          margin-top: 24px;
          padding: 16px 20px;
          background-color: #fff3cd;
          border-left: 4px solid #ffc107;
          border-radius: 4px;
        }
        .warning-box p {
          margin: 0;
          color: #664d03;
          font-size: 14px;
          line-height: 1.6;
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
          <span class="emoji">🔔</span>
          <h1>New Login Detected</h1>
        </div>
        <div class="content">
          <p>A new login was detected on your website. Here are the details:</p>
          
          <div class="info-section">
            <div class="info-row">
              <span class="label">User:</span>
              <span class="value">${name || 'N/A'}</span>
            </div>
            
            <div class="info-row">
              <span class="label">Email:</span>
              <span class="value">${email}</span>
            </div>
            
            <div class="info-row">
              <span class="label">Login Time:</span>
              <span class="value">${loginTime.toLocaleString('en-US', {
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
              <span class="label">Browser/Device:</span>
              <span class="value">${userAgent}</span>
            </div>
            `
                : ''
            }
          </div>
          
          <div class="warning-box">
            <p>⚠️ If this wasn't you or you don't recognize this activity, please check your account security settings immediately.</p>
          </div>
        </div>
        <div class="footer">
          <p>This is an automated notification from <a href="https://dilipdawadi.com.np">dilipdawadi.com.np</a></p>
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
