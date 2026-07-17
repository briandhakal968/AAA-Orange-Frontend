import type { Metadata } from "next";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Cookie Policy | AAA Orange",
};

export default function CookiePolicyPage() {
  return (
    <main className="flex-1">
      <Container>
        <div className="py-12 md:py-20 max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-light tracking-tight mb-8">
            Cookie Policy
          </h1>

          <p className="text-sm text-neutral-500 mb-8">
            Last updated: July 16, 2026
          </p>

          <div className="space-y-8 text-sm text-neutral-600 leading-relaxed">
            <section>
              <h2 className="text-lg font-medium text-black mb-3">1. What Are Cookies</h2>
              <p className="mb-3">
                Cookies are small text files that are placed on your device when you visit a website. They are widely used to make websites work efficiently and to provide information to website owners. Cookies help us recognize your device and remember certain information about your visit.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-black mb-3">2. How We Use Cookies</h2>
              <p className="mb-3">
                We use cookies for the following purposes:
              </p>
              <ul className="list-disc pl-5 space-y-2 mb-3">
                <li><strong>Strictly Necessary Cookies:</strong> These cookies are essential for the website to function. They enable core features such as security, account authentication, shopping cart functionality, and checkout processing. The website cannot function properly without these cookies.</li>
                <li><strong>Functional Cookies:</strong> These cookies allow the website to remember choices you make, such as your selected country, language, or region. They provide enhanced, personalized features and may be set by us or by third-party providers whose services we have added to our pages.</li>
                <li><strong>Analytics Cookies:</strong> These cookies collect information about how visitors use our website, such as which pages are visited most often and any error messages encountered. All information collected is aggregated and anonymous. We use this data to improve how our website works.</li>
                <li><strong>Marketing Cookies:</strong> These cookies are used to deliver advertisements more relevant to you and your interests. They are also used to limit the number of times you see an advertisement and to measure the effectiveness of advertising campaigns. They are placed by advertising networks we work with.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-medium text-black mb-3">3. Third-Party Cookies</h2>
              <p className="mb-3">
                Some cookies are placed by third-party services that appear on our pages. We use third-party cookies for analytics (such as Google Analytics), advertising, and social media functionality. These third parties may use cookies, web beacons, and similar technologies to collect information about your activity on our website and other websites. We do not control these third-party cookies and encourage you to review the privacy policies of these third parties.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-black mb-3">4. Your Cookie Choices</h2>
              <p className="mb-3">
                Under the EU General Data Protection Regulation (GDPR) and the ePrivacy Directive, you have the right to choose which cookies you accept. You can manage your cookie preferences in the following ways:
              </p>
              <ul className="list-disc pl-5 space-y-2 mb-3">
                <li><strong>Cookie Banner:</strong> When you first visit our website, you are presented with a cookie consent banner that allows you to accept or reject non-essential cookies.</li>
                <li><strong>Browser Settings:</strong> Most web browsers allow you to control cookies through their settings. You can set your browser to block or delete cookies, or to notify you when a cookie is being set. Please note that blocking essential cookies may affect the functionality of the website.</li>
                <li><strong>Opt-Out Links:</strong> You can opt out of Google Analytics by installing the <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-black">Google Analytics Opt-Out Browser Add-on</a>.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-medium text-black mb-3">5. Consent</h2>
              <p className="mb-3">
                When you first visit our website, we will ask for your consent to use non-essential cookies. You may withdraw your consent at any time by clicking the cookie settings link in the footer of any page on our website. Withdrawing consent does not affect the lawfulness of processing based on consent before its withdrawal.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-black mb-3">6. Cookie Retention</h2>
              <p className="mb-3">
                Session cookies are temporary and are deleted from your device when you close your browser. Persistent cookies remain on your device for a set period or until you delete them. The specific retention period for each cookie varies depending on its purpose. Essential session cookies are deleted when you close your browser. Functional and analytics cookies may persist for up to 24 months.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-black mb-3">7. Your Rights Under GDPR</h2>
              <p className="mb-3">
                Under the General Data Protection Regulation (GDPR), you have the following rights related to cookies and personal data collected through them:
              </p>
              <ul className="list-disc pl-5 space-y-2 mb-3">
                <li>The right to be informed about how your data is collected and used</li>
                <li>The right to access the personal data collected about you</li>
                <li>The right to rectification of inaccurate data</li>
                <li>The right to erasure of your personal data</li>
                <li>The right to restrict or object to processing</li>
                <li>The right to data portability</li>
                <li>The right to lodge a complaint with a supervisory authority</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-medium text-black mb-3">8. International Transfers</h2>
              <p className="mb-3">
                Some of our third-party cookie providers may process your data outside the European Economic Area (EEA). Where this occurs, we ensure appropriate safeguards are in place, such as Standard Contractual Clauses approved by the European Commission, to protect your personal data in compliance with GDPR requirements.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-black mb-3">9. Changes to This Policy</h2>
              <p className="mb-3">
                We may update this Cookie Policy from time to time to reflect changes in technology, legislation, or our business practices. Any changes will be posted on this page with an updated revision date. We encourage you to review this policy periodically.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-black mb-3">10. Contact Us</h2>
              <p>
                If you have any questions about our use of cookies or your rights under data protection law, please contact our Data Protection Officer at contact@aaaorange.com.
              </p>
            </section>
          </div>
        </div>
      </Container>
    </main>
  );
}
