import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — RealTron AI",
  description: "Terms governing your use of the RealTron AI platform.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Link href="/" className="text-sm text-indigo-600 hover:underline mb-8 inline-block">
          ← Back to home
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-10">Last updated: May 2026 · Pending legal review</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700">

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using the RealTron AI platform (&ldquo;the Service&rdquo;), you agree
              to be bound by these Terms of Service. If you are using the Service on behalf of an
              organisation, you represent that you have authority to bind that organisation.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Description of Service</h2>
            <p>
              RealTron AI provides an AI-powered sales infrastructure platform for real estate
              organisations, including CRM, WhatsApp automation, lead management, AI assistance,
              deal orchestration, and analytics services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Subscription and Billing</h2>
            <ul className="list-disc ps-5 space-y-1">
              <li>Subscriptions are billed monthly or annually in advance</li>
              <li>All fees are non-refundable except where required by law</li>
              <li>We reserve the right to modify pricing with 30 days&apos; notice</li>
              <li>Failure to pay may result in suspension of your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Acceptable Use</h2>
            <p className="mb-2">You agree not to use the Service to:</p>
            <ul className="list-disc ps-5 space-y-1">
              <li>Send unsolicited bulk messages (spam) via WhatsApp</li>
              <li>Circumvent Meta&apos;s WhatsApp Business API policies</li>
              <li>List fraudulent or misrepresented properties</li>
              <li>Process transactions involving sanctioned persons or entities</li>
              <li>Violate applicable data protection laws in your jurisdiction</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Data Ownership</h2>
            <p>
              You retain ownership of all data you upload to the platform — leads, inventory,
              conversation history, and analytics. We process this data to provide the Service.
              You can export or delete your data at any time subject to our retention policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Intellectual Property</h2>
            <p>
              The RealTron AI platform, including its AI models, UI, and documentation, is our
              proprietary property. You are granted a limited, non-exclusive licence to use the
              Service during your subscription term.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, RealTron AI shall not be liable for any
              indirect, incidental, special, or consequential damages arising from your use of
              the Service, including but not limited to lost profits or data loss.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Termination</h2>
            <p>
              Either party may terminate the subscription at any time. Upon termination, your
              access ends at the close of the current billing period. We will retain your data
              for 90 days after termination before permanent deletion.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Governing Law</h2>
            <p>
              These Terms are governed by the laws of the jurisdiction in which the operating
              entity is registered. Disputes will be resolved through binding arbitration unless
              prohibited by local law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Contact</h2>
            <p>
              For any questions about these Terms, contact us at{" "}
              <a href="mailto:legal@realtron.ai" className="text-indigo-600 hover:underline">
                legal@realtron.ai
              </a>
              .
            </p>
          </section>

          <p className="text-xs text-gray-400 border-t pt-6">
            These Terms are pending formal legal review before EU/UK/UAE market launch.
          </p>
        </div>
      </div>
    </div>
  );
}
