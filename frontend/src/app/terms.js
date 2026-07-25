import React from 'react';
import LegalPage from '../components/LegalPage';

const SECTIONS = [
  {
    heading: '1. Agreement',
    body: [
      {
        type: 'p',
        text:
          'These Terms of Service ("Terms") govern your use of the Tidyups Cleaning app and website at [bookscrubby.com](https://bookscrubby.com), and any cleaning services you book through them. By requesting a quote or booking a clean you agree to these Terms.',
      },
      {
        type: 'p',
        text:
          '**Tidyups Cleaning Inc.** ("Tidyups") is registered in Alberta, Canada. If any part of these Terms is unclear, contact us at [hello@tidyupscleaning.com](mailto:hello@tidyupscleaning.com) or **(780) 718-5092**.',
      },
    ],
  },
  {
    heading: '2. Quotes and bookings',
    body: [
      {
        type: 'p',
        text:
          'Quote requests are just a request — they are not confirmed appointments. A member of the Tidyups team will contact you by phone, text, or email to confirm pricing, timing, and access details. A booking is confirmed only when Tidyups responds in writing (SMS, email, or through the app) with a scheduled date.',
      },
    ],
  },
  {
    heading: '3. Payment and cancellation',
    body: [
      {
        type: 'ul',
        items: [
          'Payment is due when the clean is completed unless we agree otherwise in writing.',
          "Cancellations more than **24 hours** before the scheduled start time are free.",
          "Cancellations less than 24 hours before, or lock-outs when we arrive, may be charged a **$50 cancellation fee** to cover crew travel and lost time.",
          "Recurring bookings can be paused or ended at any time by texting or emailing us.",
        ],
      },
    ],
  },
  {
    heading: '4. Access, safety, and property',
    body: [
      {
        type: 'ul',
        items: [
          "You are responsible for providing safe access to the property and for securing pets, valuables, and fragile items.",
          "Please tell us in advance about any hazardous materials, alarms, or areas that should not be cleaned.",
          "If a cleaner does not feel safe, they may leave and Tidyups will follow up with you.",
        ],
      },
    ],
  },
  {
    heading: '5. Photos taken during the job',
    body: [
      {
        type: 'p',
        text:
          "Our team may capture before-and-after photos of the space being cleaned for quality assurance and to share results with you. Photos are handled as described in our [Privacy Policy](/privacy). You can ask us to delete any photo at any time.",
      },
    ],
  },
  {
    heading: '6. Satisfaction and re-cleans',
    body: [
      {
        type: 'p',
        text:
          "If you are not happy with a clean, contact us **within 24 hours** of completion. We will come back and re-clean the affected area at no charge. This is our only guarantee; refunds are provided only when we cannot resolve the issue with a re-clean.",
      },
    ],
  },
  {
    heading: '7. Reviews and communications',
    body: [
      {
        type: 'p',
        text:
          "After a completed clean, we may send you a one-time text message with a link to leave a Google review. Reply STOP or ignore the message at any time to opt out of future review requests.",
      },
    ],
  },
  {
    heading: '8. Liability',
    body: [
      {
        type: 'p',
        text:
          "Tidyups carries commercial liability insurance. Our total liability for any claim relating to a clean is limited to the amount you paid for that clean. We are not liable for indirect or consequential losses. Nothing in these Terms limits liability that cannot be excluded under applicable Alberta law.",
      },
    ],
  },
  {
    heading: '9. Acceptable use of the app',
    body: [
      {
        type: 'p',
        text:
          "Please use the app honestly and only to book legitimate services. Do not attempt to disrupt or reverse-engineer the app. Staff and admin credentials are for authorised personnel only.",
      },
    ],
  },
  {
    heading: '10. Changes',
    body: [
      {
        type: 'p',
        text:
          "We may update these Terms from time to time. Material changes will be shown inside the app before they take effect.",
      },
    ],
  },
  {
    heading: '11. Governing law',
    body: [
      {
        type: 'p',
        text:
          "These Terms are governed by the laws of the Province of Alberta and the applicable federal laws of Canada.",
      },
    ],
  },
];

export default function TermsScreen() {
  return (
    <LegalPage
      testID="terms-page"
      kicker="Legal"
      title="Terms of Service"
      updated="February 24, 2026"
      intro="These Terms cover using the Tidyups Cleaning app and booking a cleaning service with Tidyups Cleaning Inc."
      sections={SECTIONS}
    />
  );
}
