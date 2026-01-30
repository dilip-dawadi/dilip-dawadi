import type { Metadata } from 'next';
import PageWrapper from '@/components/Template/PageWrapper';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Privacy Policy for dilipdawadi.com.np - How we collect, use, and protect your information.',
};

export default function PrivacyPolicyPage() {
  return (
    <PageWrapper>
      <section className="about-page">
        <header className="about-header">
          <h1 className="page-title">Privacy Policy</h1>
          <p className="page-subtitle">Last Updated: January 29, 2026</p>
        </header>

        <article className="about-content">
          <section>
            <h1>Introduction</h1>
            <p>
              Welcome to Dilip Dawadi's personal website ("we," "our," or "us"). This Privacy Policy
              explains how we collect, use, disclose, and safeguard your information when you visit
              our website dilipdawadi.com.np.
            </p>
          </section>

          <section>
            <h1>Information We Collect</h1>
            <p>
              <strong>Information You Provide:</strong> When you use our authentication services, we
              collect:
            </p>
            <ul>
              <li>Name</li>
              <li>Email address</li>
              <li>Profile information from Google OAuth</li>
            </ul>

            <p>
              <strong>Automatically Collected Information:</strong> When you visit our website, we
              automatically collect:
            </p>
            <ul>
              <li>IP address</li>
              <li>Browser type and version</li>
              <li>Device information</li>
              <li>Pages visited and time spent on pages</li>
              <li>Referring website addresses</li>
            </ul>
          </section>

          <section>
            <h1>How We Use Your Information</h1>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide and maintain our services</li>
              <li>Authenticate and authorize users</li>
              <li>Send security notifications about login attempts</li>
              <li>Improve and optimize our website</li>
              <li>Prevent fraud and enhance security</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h1>Google OAuth and Gmail API</h1>
            <p>
              We use Google OAuth for authentication and Gmail API to send security notifications.
              When you sign in with Google:
            </p>
            <ul>
              <li>We access your basic profile information (name, email)</li>
              <li>We use Gmail API only to send security notifications to your email</li>
              <li>We do not read, modify, or access your Gmail inbox or messages</li>
              <li>We do not share your Google account information with third parties</li>
            </ul>
            <p>
              <strong>Gmail API Limited Use Disclosure:</strong> This application's use and transfer
              of information received from Google APIs to any other app will adhere to{' '}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements.
            </p>
          </section>

          <section>
            <h1>Data Storage and Security</h1>
            <p>
              We implement appropriate technical and organizational security measures to protect
              your personal information. Your data is stored securely using industry-standard
              encryption and access controls.
            </p>
            <ul>
              <li>Database: PostgreSQL with SSL encryption (Neon)</li>
              <li>Authentication: NextAuth.js with secure session management</li>
              <li>Hosting: Vercel with HTTPS encryption</li>
            </ul>
          </section>

          <section>
            <h1>Data Sharing and Disclosure</h1>
            <p>
              We do not sell, trade, or rent your personal information to third parties. We may
              share your information only in the following circumstances:
            </p>
            <ul>
              <li>
                <strong>With your consent:</strong> When you explicitly agree to share information
              </li>
              <li>
                <strong>Legal requirements:</strong> When required by law or to protect our rights
              </li>
              <li>
                <strong>Service providers:</strong> With trusted third-party services (Google OAuth,
                Vercel, Neon) that help us operate our website
              </li>
            </ul>
          </section>

          <section>
            <h1>Your Rights</h1>
            <p>You have the right to:</p>
            <ul>
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your account and data</li>
              <li>Opt-out of email notifications</li>
              <li>Revoke Google OAuth access at any time</li>
            </ul>
            <p>
              To exercise these rights, contact us at:{' '}
              <a href="mailto:info@dilipdawadi.com.np">info@dilipdawadi.com.np</a>
            </p>
          </section>

          <section>
            <h1>Cookies and Tracking</h1>
            <p>
              We use cookies and similar tracking technologies to enhance your experience. Essential
              cookies are required for authentication and security. You can control cookie
              preferences through your browser settings.
            </p>
          </section>

          <section>
            <h1>Third-Party Links</h1>
            <p>
              Our website may contain links to third-party websites. We are not responsible for the
              privacy practices of these external sites. We encourage you to review their privacy
              policies.
            </p>
          </section>

          <section>
            <h1>Children's Privacy</h1>
            <p>
              Our website is not intended for children under 13 years of age. We do not knowingly
              collect personal information from children under 13.
            </p>
          </section>

          <section>
            <h1>Changes to This Privacy Policy</h1>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes
              by posting the new Privacy Policy on this page and updating the "Last Updated" date.
            </p>
          </section>

          <section>
            <h1>Contact Information</h1>
            <p>If you have questions about this Privacy Policy, please contact:</p>
            <p>
              <strong>Dilip Dawadi</strong>
              <br />
              Email: <a href="mailto:info@dilipdawadi.com.np">info@dilipdawadi.com.np</a>
              <br />
              Website: <a href="https://dilipdawadi.com.np">dilipdawadi.com.np</a>
              <br />
              Location: Toronto, Ontario, Canada
            </p>
          </section>

          <section>
            <h1>Data Retention</h1>
            <p>
              We retain your personal information only as long as necessary to provide our services
              and comply with legal obligations. You may request deletion of your account at any
              time.
            </p>
          </section>
        </article>
      </section>
    </PageWrapper>
  );
}
