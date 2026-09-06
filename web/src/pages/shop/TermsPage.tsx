import React from "react";
import { Link } from "react-router-dom";
import { FileText, ShoppingBag, Truck, RefreshCcw, AlertTriangle, ChevronRight } from "lucide-react";

const sections = [
  {
    icon: ShoppingBag,
    title: "Ordering & Availability",
    color: "bg-orange-50",
    iconColor: "text-primary",
    items: [
      "All orders are subject to product availability. If a product is out of stock, we will notify you promptly.",
      "Prices displayed on the website are in Nepali Rupees (NPR) and are subject to change without prior notice.",
      "We reserve the right to refuse or cancel any order at our discretion, including orders containing incorrect pricing.",
      "Minimum order amounts may apply for delivery orders.",
      "Custom weight orders are accepted within the range specified on the product page.",
    ],
  },
  {
    icon: Truck,
    title: "Delivery Policy",
    color: "bg-blue-50",
    iconColor: "text-blue-600",
    items: [
      "Delivery is available within our designated service area. Please confirm availability before placing your order.",
      "Estimated delivery times are approximate and may vary depending on location, traffic, and weather conditions.",
      "A delivery fee of Rs. 10 applies to orders below Rs. 100. Free delivery is available for eligible orders.",
      "We are not responsible for delays caused by circumstances beyond our control (e.g., strikes, extreme weather).",
      "Customers must ensure someone is available at the delivery address to receive the order.",
    ],
  },
  {
    icon: RefreshCcw,
    title: "Cancellations & Returns",
    color: "bg-green-50",
    iconColor: "text-green-600",
    items: [
      "Orders can only be cancelled while the status is 'pending' (before confirmation).",
      "Once an order is confirmed by the admin, products cannot be cancelled, returned, or refunded under any circumstances.",
    ],
  },
  {
    icon: AlertTriangle,
    title: "Allergies & Food Safety",
    color: "bg-red-50",
    iconColor: "text-red-500",
    items: [
      "Our products may contain nuts, dairy, gluten, and other common allergens. Please read product labels carefully.",
      "While we take precautions, cross-contamination may occur in our kitchen/packaging environment.",
      "If you have known food allergies, please contact us directly before placing an order.",
      "Best-before dates are strictly respected. We do not sell expired products.",
      "Store products as indicated on the packaging to maintain freshness.",
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Hero */}
      <div className="bg-stone-900 text-white py-14 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-7 h-7 text-black" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-3">Terms & Conditions</h1>
          <p className="text-stone-400 font-medium text-sm md:text-base">
            Last updated: August 2026 · Gole Khaja Ghar, Nepal
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12 md:py-16">
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-7 md:p-10 space-y-10">
          {/* Intro */}
          <section>
            <p className="text-stone-600 font-medium leading-relaxed">
              By accessing and using the <strong className="text-stone-900">Gole Khaja Ghar</strong> website and ordering service, you agree to be bound by these Terms & Conditions. Please read them carefully before placing an order.
            </p>
          </section>

          {/* Acceptance */}
          <section>
            <h2 className="text-xl font-black text-stone-900 mb-3">Acceptance of Terms</h2>
            <p className="text-stone-600 font-medium leading-relaxed">
              By creating an account or placing an order through our platform, you confirm that you are at least 13 years of age and have the legal capacity to enter into a binding agreement. These terms apply to all visitors, users, and customers of our service.
            </p>
          </section>

          {/* Dynamic sections */}
          {sections.map((section) => (
            <section key={section.title}>
              <div className="flex items-center gap-2.5 mb-4">
                <div className={`w-9 h-9 ${section.color} rounded-xl flex items-center justify-center`}>
                  <section.icon className={`w-5 h-5 ${section.iconColor}`} />
                </div>
                <h2 className="text-xl font-black text-stone-900">{section.title}</h2>
              </div>
              <ul className="space-y-2.5">
                {section.items.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-stone-600 font-medium leading-relaxed text-sm md:text-base"
                  >
                    <ChevronRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          {/* Payments */}
          <section>
            <h2 className="text-xl font-black text-stone-900 mb-3">Payment</h2>
            <div className="text-stone-600 font-medium leading-relaxed space-y-2">
              <p>We accept the following payment methods:</p>
              <ul className="space-y-2 pl-4 mt-3">
                {[
                  "Cash on Delivery (COD): Pay in cash when your order is delivered or at pickup.",
                  "QR Scan & Pay: Scan our Fonepay / eSewa / Bank QR code and complete payment before order confirmation.",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3">
                For QR payments, please retain a screenshot of your payment confirmation. We are not liable for payments made to incorrect QR codes or accounts.
              </p>
            </div>
          </section>

          {/* User Accounts */}
          <section>
            <h2 className="text-xl font-black text-stone-900 mb-3">User Accounts</h2>
            <div className="text-stone-600 font-medium leading-relaxed space-y-2">
              <ul className="space-y-2">
                {[
                  "You are responsible for maintaining the confidentiality of your account credentials.",
                  "You agree to notify us immediately of any unauthorized use of your account.",
                  "We reserve the right to suspend or terminate accounts that violate these terms.",
                  "Each customer may maintain one account per email address.",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-xl font-black text-stone-900 mb-3">Changes to These Terms</h2>
            <p className="text-stone-600 font-medium leading-relaxed">
              We reserve the right to update these Terms & Conditions at any time. Changes will be posted on this page with an updated date. Continued use of our service after changes constitutes acceptance of the new terms.
            </p>
          </section>

          {/* Governing Law */}
          <section className="bg-stone-50 rounded-2xl p-6">
            <h2 className="text-lg font-black text-stone-900 mb-2">Governing Law</h2>
            <p className="text-stone-600 font-medium leading-relaxed text-sm">
              These Terms & Conditions are governed by the laws of Nepal. Any disputes arising from the use of our service shall be subject to the jurisdiction of the courts of Nepal.
            </p>
          </section>
        </div>

        {/* Back links */}
        <div className="mt-8 text-center">
          <Link to="/" className="text-sm font-bold text-stone-500 hover:text-primary transition-colors">
            ← Back to Home
          </Link>
          <span className="mx-3 text-stone-300">·</span>
          <Link to="/privacy-policy" className="text-sm font-bold text-stone-500 hover:text-primary transition-colors">
            Privacy Policy →
          </Link>
        </div>
      </div>
    </div>
  );
}
