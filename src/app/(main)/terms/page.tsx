import type { Metadata } from "next";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Terms and Conditions | AAA Orange",
};

export default function TermsPage() {
  return (
    <main className="flex-1">
      <Container>
        <div className="py-12 md:py-20 max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-light tracking-tight mb-8">
            Terms and Conditions
          </h1>

          <p className="text-sm text-neutral-500 mb-8">
            Last updated: July 16, 2026
          </p>

          <div className="space-y-8 text-sm text-neutral-600 leading-relaxed">
            <section>
              <h2 className="text-lg font-medium text-black mb-3">1. Acceptance of Terms</h2>
              <p className="mb-3">
                By accessing or using the AAA Orange website and services, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you may not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-black mb-3">2. Account Registration</h2>
              <p className="mb-3">
                You must be at least 16 years old to create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to provide accurate and complete information when creating your account and to keep it up to date.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-black mb-3">3. Products and Pricing</h2>
              <p className="mb-3">
                We strive to display accurate product information, including prices, descriptions, and images. However, errors may occur. We reserve the right to correct any errors, inaccuracies, or omissions and to change or update information at any time without prior notice. All prices are subject to change and may vary by country.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-black mb-3">4. Orders and Payment</h2>
              <p className="mb-3">
                Placing an order constitutes an offer to purchase. We reserve the right to accept or decline any order. Payment must be received in full before an order is processed. We accept the payment methods displayed at checkout. All transactions are processed securely through our payment partners.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-black mb-3">5. Shipping and Delivery</h2>
              <p className="mb-3">
                Shipping times and costs vary by location and shipping method selected. We are not responsible for delays caused by customs, weather, or other circumstances beyond our control. Risk of loss and title for items pass to you upon delivery to the carrier.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-black mb-3">6. Returns and Refunds</h2>
              <p className="mb-3">
                You may return eligible items within 30 days of delivery. Items must be unused, in original packaging, and in the same condition as received. Refunds are processed to the original payment method within 5-10 business days after we receive the return. Certain items may be final sale and non-returnable.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-black mb-3">7. Intellectual Property</h2>
              <p className="mb-3">
                All content on this website, including text, images, logos, graphics, and software, is the property of AAA Orange or its licensors and is protected by copyright and trademark laws. You may not reproduce, distribute, or create derivative works without our express written permission.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-black mb-3">8. Prohibited Conduct</h2>
              <p className="mb-3">
                You agree not to use our services for any unlawful purpose, attempt to gain unauthorized access to our systems, interfere with the proper functioning of the website, use automated systems to scrape or collect data, or engage in any activity that could damage or impair our services.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-black mb-3">9. Limitation of Liability</h2>
              <p className="mb-3">
                To the maximum extent permitted by law, AAA Orange shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our services. Our total liability shall not exceed the amount you paid for the specific product or service in question.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-black mb-3">10. Governing Law</h2>
              <p className="mb-3">
                These Terms and Conditions are governed by and construed in accordance with applicable laws. Any disputes arising under these terms shall be resolved through good faith negotiation first, followed by binding arbitration if necessary.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-black mb-3">11. Changes to Terms</h2>
              <p className="mb-3">
                We reserve the right to modify these Terms and Conditions at any time. Changes take effect upon posting to this page. Your continued use of our services after changes are posted constitutes acceptance of the updated terms.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-black mb-3">12. Contact Us</h2>
              <p>
                If you have any questions about these Terms and Conditions, please contact us at contact@aaaorange.com.
              </p>
            </section>
          </div>
        </div>
      </Container>
    </main>
  );
}
