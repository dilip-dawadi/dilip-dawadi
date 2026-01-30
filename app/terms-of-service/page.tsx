import type { Metadata } from 'next';
import PageWrapper from '@/components/Template/PageWrapper';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'Terms of Service for dilipdawadi.com.np - Rules and guidelines for using our website.',
};

export default function TermsOfServicePage() {
  return (
    <PageWrapper>
      <section className="about-page">
        <header className="about-header">
          <h1 className="page-title">Terms of Service</h1>
          <p className="page-subtitle">Last Updated: January 29, 2026</p>
        </header>

        <article className="about-content">
          <section>
            <h1>Acceptance of Terms</h1>
            <p>
              By accessing and using dilipdawadi.com.np ("Website"), you accept and agree to be
              bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please
              do not use our Website.
            </p>
          </section>

          <section>
            <h1>Description of Service</h1>
            <p>
              dilipdawadi.com.np is a personal portfolio website showcasing professional work,
              projects, blog posts, and providing contact information. The Website includes:
            </p>
            <ul>
              <li>Portfolio and project showcases</li>
              <li>Blog and writing content</li>
              <li>User authentication via Google OAuth</li>
              <li>Contact forms and communication features</li>
              <li>Admin dashboard for site management</li>
            </ul>
          </section>

          <section>
            <h1>User Accounts and Authentication</h1>
            <p>
              <strong>Account Creation:</strong> To access certain features, you may need to create
              an account using Google OAuth. By creating an account, you agree to:
            </p>
            <ul>
              <li>Provide accurate and current information</li>
              <li>Maintain the security of your account</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Notify us immediately of any unauthorized access</li>
            </ul>
            <p>
              <strong>Account Termination:</strong> We reserve the right to suspend or terminate
              your account at any time for violation of these Terms or any unlawful activity.
            </p>
          </section>

          <section>
            <h1>User Conduct</h1>
            <p>You agree NOT to:</p>
            <ul>
              <li>Use the Website for any illegal or unauthorized purpose</li>
              <li>Attempt to gain unauthorized access to any part of the Website</li>
              <li>Interfere with or disrupt the Website or servers</li>
              <li>Upload or transmit viruses, malware, or malicious code</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Impersonate any person or entity</li>
              <li>Collect or harvest personal information of other users</li>
              <li>Use automated systems (bots, scrapers) without permission</li>
            </ul>
          </section>

          <section>
            <h1>Intellectual Property</h1>
            <p>
              <strong>Website Content:</strong> All content on this Website, including but not
              limited to text, graphics, logos, images, code, and design, is the property of Dilip
              Dawadi and is protected by copyright and intellectual property laws.
            </p>
            <p>
              <strong>User Content:</strong> If you submit content (comments, feedback, messages),
              you grant us a non-exclusive, worldwide, royalty-free license to use, reproduce, and
              display such content in connection with the Website.
            </p>
            <p>
              <strong>Open Source:</strong> Some portions of this Website may be open source. Such
              code is subject to its respective open source licenses.
            </p>
          </section>

          <section>
            <h1>Privacy and Data Protection</h1>
            <p>
              Your use of the Website is also governed by our{' '}
              <a href="/privacy-policy">Privacy Policy</a>. By using the Website, you consent to our
              collection and use of personal information as outlined in the Privacy Policy.
            </p>
          </section>

          <section>
            <h1>Third-Party Services</h1>
            <p>Our Website uses third-party services including but not limited to:</p>
            <ul>
              <li>Google OAuth for authentication</li>
              <li>Gmail API for email notifications</li>
              <li>Vercel for hosting</li>
              <li>Neon for database services</li>
            </ul>
            <p>
              These services have their own terms and policies. We are not responsible for the
              actions or policies of third-party services.
            </p>
          </section>

          <section>
            <h1>Disclaimers and Limitations of Liability</h1>
            <p>
              <strong>"As Is" Basis:</strong> The Website is provided on an "AS IS" and "AS
              AVAILABLE" basis without warranties of any kind, either express or implied.
            </p>
            <p>
              <strong>No Warranty:</strong> We do not warrant that the Website will be
              uninterrupted, secure, or error-free. We do not guarantee the accuracy or completeness
              of any information on the Website.
            </p>
            <p>
              <strong>Limitation of Liability:</strong> To the maximum extent permitted by law,
              Dilip Dawadi shall not be liable for any indirect, incidental, special, consequential,
              or punitive damages arising from your use of the Website.
            </p>
          </section>

          <section>
            <h1>Indemnification</h1>
            <p>
              You agree to indemnify and hold harmless Dilip Dawadi from any claims, losses,
              damages, liabilities, and expenses arising from your use of the Website or violation
              of these Terms.
            </p>
          </section>

          <section>
            <h1>Email Communications</h1>
            <p>By using our authentication services, you consent to receive:</p>
            <ul>
              <li>Security notifications about failed login attempts</li>
              <li>Important updates about your account</li>
              <li>Service-related announcements</li>
            </ul>
            <p>You may opt-out of non-essential communications by contacting us.</p>
          </section>

          <section>
            <h1>Changes to Terms</h1>
            <p>
              We reserve the right to modify these Terms at any time. Changes will be effective
              immediately upon posting. Your continued use of the Website after changes constitutes
              acceptance of the modified Terms.
            </p>
          </section>

          <section>
            <h1>Termination</h1>
            <p>
              We may terminate or suspend your access to the Website immediately, without prior
              notice, for any reason, including breach of these Terms.
            </p>
          </section>

          <section>
            <h1>Governing Law</h1>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of Ontario,
              Canada, without regard to its conflict of law provisions.
            </p>
          </section>

          <section>
            <h1>Dispute Resolution</h1>
            <p>
              Any disputes arising from these Terms or your use of the Website shall be resolved
              through good faith negotiations. If negotiations fail, disputes will be subject to the
              exclusive jurisdiction of the courts in Toronto, Ontario, Canada.
            </p>
          </section>

          <section>
            <h1>Severability</h1>
            <p>
              If any provision of these Terms is found to be invalid or unenforceable, the remaining
              provisions shall remain in full force and effect.
            </p>
          </section>

          <section>
            <h1>Contact Information</h1>
            <p>For questions about these Terms of Service, please contact:</p>
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
            <h1>Entire Agreement</h1>
            <p>
              These Terms, together with our Privacy Policy, constitute the entire agreement between
              you and Dilip Dawadi regarding your use of the Website.
            </p>
            <p>
              <strong>
                By using dilipdawadi.com.np, you acknowledge that you have read, understood, and
                agree to be bound by these Terms of Service.
              </strong>
            </p>
          </section>
        </article>
      </section>
    </PageWrapper>
  );
}
