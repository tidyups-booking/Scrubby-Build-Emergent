import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { BRAND } from "@/lib/data";

const SECTIONS = [
  {
    h: "1. Information We Collect",
    p: "When you request a free quote through our website, we collect the information you provide in the form: your full name, phone number, email address, street address, city, province, postal code, the type of cleaning service you're interested in, property details (property type, number of bedrooms and bathrooms), your preferred service date, and any additional message you include.",
  },
  {
    h: "2. How We Use Your Information",
    p: "We use your information solely to respond to your quote request and provide our cleaning services: to contact you by phone, SMS, or email with your quote; to schedule and deliver cleaning services at the address you provide; and to keep internal records of quote requests for our business operations. We do not use your information for third-party advertising.",
  },
  {
    h: "3. How Your Information Is Stored",
    p: "Quote submissions are stored securely in our database. Copies of quote submissions may also be stored in our private business records (such as a spreadsheet accessible only to Tidyups Cleaning Service staff). When you submit a quote request, an automated notification containing your submission details is sent to our team so we can respond quickly.",
  },
  {
    h: "4. Sharing of Information",
    p: "We do not sell, rent, or trade your personal information. Your information is only shared with service providers we use to operate our business (such as our website hosting, database, and messaging providers), and only to the extent necessary to deliver our services. These providers are not permitted to use your information for their own purposes.",
  },
  {
    h: "5. Data Retention",
    p: "We retain quote submissions for as long as needed for our business records. If you would like your information removed from our records, contact us using the details below and we will delete it.",
  },
  {
    h: "6. Cookies & Analytics",
    p: "Our website does not require you to create an account and does not use advertising cookies. Basic technical data (such as browser type) may be processed by our hosting provider to keep the site running securely.",
  },
  {
    h: "7. Your Rights",
    p: "You may request access to, correction of, or deletion of the personal information we hold about you at any time. To make a request, contact us by phone or email using the details below.",
  },
  {
    h: "8. Children's Privacy",
    p: "Our services are intended for adults booking cleaning services. We do not knowingly collect personal information from children under 13.",
  },
  {
    h: "9. Changes to This Policy",
    p: "We may update this privacy policy from time to time. The latest version will always be available on this page, with the effective date shown below.",
  },
];

export default function Privacy() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-14 sm:px-8">
      <div className="aurora pointer-events-none fixed inset-0 -z-10 opacity-40" />
      <Link to="/" data-testid="privacy-back-link" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-pink transition-colors hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back to home
      </Link>

      <div className="mt-8 flex items-center gap-4">
        <div className="brand-gradient-bg flex h-14 w-14 items-center justify-center rounded-2xl">
          <ShieldCheck className="h-7 w-7 text-white" />
        </div>
        <div>
          <h1 data-testid="privacy-title" className="font-display text-3xl font-extrabold sm:text-4xl">Privacy Policy</h1>
          <p className="mt-1 text-sm text-white/50">Effective date: June 1, 2026</p>
        </div>
      </div>

      <div className="glass mt-8 rounded-3xl p-7 sm:p-10">
        <p className="text-sm leading-relaxed text-white/70">
          {BRAND.name} ("Tidyups", "we", "us") respects your privacy. This policy explains what
          information we collect when you use our website or request a quote, how we use it, and
          the choices you have.
        </p>

        {SECTIONS.map((s) => (
          <div key={s.h} className="mt-8">
            <h2 className="font-display text-lg font-bold text-white">{s.h}</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/60">{s.p}</p>
          </div>
        ))}

        <div className="mt-10 rounded-2xl border border-brand-magenta/25 bg-brand-magenta/10 p-6">
          <h2 className="font-display text-lg font-bold text-white">10. Contact Us</h2>
          <p className="mt-2 text-sm leading-relaxed text-white/70">
            Questions about this policy or your data? Reach out anytime:
          </p>
          <ul className="mt-3 space-y-1.5 text-sm text-white/70">
            <li>Phone: <a href={BRAND.phonePrimaryHref} className="font-semibold text-brand-pink hover:underline">{BRAND.phonePrimary}</a></li>
            <li>Toll-free: <a href={BRAND.phoneTollHref} className="font-semibold text-brand-pink hover:underline">{BRAND.phoneToll}</a></li>
            <li>Email: <a href={`mailto:${BRAND.email}`} className="font-semibold text-brand-pink hover:underline">{BRAND.email}</a></li>
            <li>Address: {BRAND.address}</li>
          </ul>
        </div>
      </div>

      <p className="mt-8 text-center text-xs text-white/30">© {new Date().getFullYear()} {BRAND.name} · Edmonton, AB</p>
    </main>
  );
}
