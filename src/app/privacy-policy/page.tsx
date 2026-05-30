import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — RealTron AI",
  description: "How RealTron AI collects, uses, and protects your personal data.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Link href="/" className="text-sm text-indigo-600 hover:underline mb-8 inline-block">
          ← Back to home
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-10">Last updated: May 2026 · Pending legal review</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700">

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Who We Are</h2>
            <p>
              RealTron AI is a global AI sales infrastructure platform for real estate organisations.
              References to &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;RealTron AI&rdquo; in this
              policy mean the operating entity that provides your organisation&apos;s workspace.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. What Data We Collect</h2>
            <ul className="list-disc ps-5 space-y-1">
              <li>Account information: phone number, name, email address, role</li>
              <li>Organisation data: name, country, payment settings</li>
              <li>CRM data: leads, WhatsApp conversation history, property details</li>
              <li>Usage data: page views, feature interactions, API calls (analytics cookies)</li>
              <li>Documents uploaded for AI OCR analysis</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. How We Use Your Data</h2>
            <ul className="list-disc ps-5 space-y-1">
              <li>Providing and improving the platform</li>
              <li>AI-powered lead qualification and conversation routing</li>
              <li>Fraud prevention and AML compliance screening</li>
              <li>Billing and subscription management</li>
              <li>Sending operational notifications (WhatsApp, email)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Cookies</h2>
            <p className="mb-2">We use two categories of cookies:</p>
            <ul className="list-disc ps-5 space-y-1">
              <li>
                <strong>Essential cookies</strong> — required for authentication and security.
                These cannot be disabled.
              </li>
              <li>
                <strong>Analytics cookies</strong> — help us understand how the platform is used
                (Sentry error monitoring). Only set with your consent.
              </li>
            </ul>
            <p className="mt-2">
              You can withdraw consent at any time by clearing your browser&apos;s localStorage.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Your Rights</h2>
            <p className="mb-2">
              Depending on your jurisdiction (GDPR, UK GDPR, CCPA, PDPL), you may have the right to:
            </p>
            <ul className="list-disc ps-5 space-y-1">
              <li>Access the personal data we hold about you</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data (Right to Be Forgotten)</li>
              <li>Data portability</li>
              <li>Object to processing</li>
            </ul>
            <p className="mt-2">
              To exercise any right, contact your organisation administrator or reach us at the
              address below.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Data Retention</h2>
            <p>
              We retain your data for as long as your organisation&apos;s subscription is active,
              plus up to 90 days after termination for audit purposes. WhatsApp conversation logs
              are retained for 12 months by default.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. International Transfers</h2>
            <p>
              Data may be processed in the UK, EU, UAE, or US depending on your organisation&apos;s
              data residency configuration. EU and UK organisations may elect regional data storage
              under GDPR/UK GDPR requirements.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Contact</h2>
            <p>
              For privacy-related queries, email{" "}
              <a href="mailto:privacy@realtron.ai" className="text-indigo-600 hover:underline">
                privacy@realtron.ai
              </a>
              . For GDPR/UK GDPR requests, you also have the right to lodge a complaint with
              your local supervisory authority.
            </p>
          </section>

          <p className="text-xs text-gray-400 border-t pt-6">
            This policy is pending formal legal review. Content will be updated before EU/UK
            market launch.
          </p>
        </div>
      </div>
    </div>
  );
}
