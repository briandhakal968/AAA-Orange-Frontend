import type { Metadata } from "next";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Privacy Policy | AAA Orange",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="flex-1">
      <Container>
        <div className="py-12 md:py-20 max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-light tracking-tight mb-8">
            Privacy Policy
          </h1>

          <p className="text-sm text-neutral-500 mb-8">
            Last updated: July 16, 2026
          </p>

          <div className="space-y-8 text-sm text-neutral-600 leading-relaxed">
            <section>
              <h2 className="text-lg font-medium text-black mb-3">1. Information We Collect</h2>
              <p className="mb-3">
                When you create an account, we collect your name, email address, and password. When you place an order, we collect your shipping address, billing information, and phone number. We also collect browsing data such as pages viewed, products searched, and your device information to improve our services.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-black mb-3">2. How We Use Your Information</h2>
              <p className="mb-3">
                We use your information to process orders, manage your account, send order updates and promotional emails, improve our website and services, prevent fraud, and comply with legal obligations. We may also use your data to personalize your shopping experience and recommend products based on your preferences.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-black mb-3">3. Sharing Your Information</h2>
              <p className="mb-3">
                We share your information with payment processors to complete transactions, shipping carriers to deliver your orders, and analytics providers to understand website usage. We do not sell your personal information to third parties. We may share data when required by law or to protect our rights.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-black mb-3">4. Cookies</h2>
              <p className="mb-3">
                We use cookies and similar technologies to remember your preferences, keep you logged in, analyze website traffic, and personalize content. You can control cookies through your browser settings, though some features may not work properly if cookies are disabled.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-black mb-3">5. Data Security</h2>
              <p className="mb-3">
                We implement industry-standard security measures to protect your personal information, including encryption of sensitive data, secure server infrastructure, and regular security audits. However, no method of transmission over the internet is completely secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-black mb-3">6. Your Rights</h2>
              <p className="mb-3">
                You have the right to access, correct, or delete your personal data. You can update your account information at any time through your profile settings. To request deletion of your data, please contact us at contact@aaaorange.com. You may also opt out of marketing communications at any time.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-black mb-3">7. Data Retention</h2>
              <p className="mb-3">
                We retain your personal information for as long as your account is active or as needed to provide services. We may retain certain data as required by law or for legitimate business purposes, such as fraud prevention and record keeping.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-black mb-3">8. Children&apos;s Privacy</h2>
              <p className="mb-3">
                Our services are not intended for individuals under the age of 16. We do not knowingly collect personal information from children. If we become aware that we have collected data from a child, we will take steps to delete it promptly.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-black mb-3">9. Changes to This Policy</h2>
              <p className="mb-3">
                We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated revision date. We encourage you to review this policy periodically for any updates.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-black mb-3">10. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us at contact@aaaorange.com.
              </p>
            </section>
          </div>
        </div>
      </Container>
    </main>
  );
}
