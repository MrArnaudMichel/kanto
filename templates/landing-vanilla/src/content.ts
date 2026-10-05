/**
 * Every word and every number on the page, in one place: rewrite this file and
 * the page is yours. The sections read it in order, top to bottom.
 */
import type { KtFaqItem, KtFeature, KtFooterColumn, KtPlan, KtTestimonial } from 'kanto-ds';

export const PRODUCT = 'Northwind';

export const NAV = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Questions', href: '#questions' },
];

export const HERO = {
  announcement: 'New: recurring invoices',
  heading: 'Invoices that pay themselves',
  lead: 'Send, chase and reconcile in one place — and get paid on the day you said.',
  primary: 'Start free',
  primaryHref: '#start',
  secondary: 'See pricing',
  secondaryHref: '#pricing',
  note: 'Free for three months. No card needed.',
};

export const LOGOS = {
  heading: 'Trusted by finance teams at',
  names: ['Kiln', 'Halcyon', 'Fieldnote', 'Orbital', 'Sato Ceramics', 'Juniper'],
};

export const FEATURES: { heading: string; lead: string; items: KtFeature[] } = {
  heading: 'Why teams switch',
  lead: 'Less chasing, more paid — and the books close themselves.',
  items: [
    {
      icon: 'send',
      title: 'Sent in a second',
      description: 'From the quote to the inbox in one click, with the PDF attached.',
    },
    {
      icon: 'refresh-cw',
      title: 'Chased for you',
      description: 'Polite reminders go out on the schedule you set, and stop when it is paid.',
    },
    {
      icon: 'circle-check',
      title: 'Reconciled',
      description: 'Payments are matched to their invoices as they land in the bank.',
    },
    {
      icon: 'file',
      title: 'Every format',
      description: 'PDF, UBL and the e-invoicing formats your customers ask for.',
    },
    {
      icon: 'user',
      title: 'Your accountant, invited',
      description: 'A guest seat that sees the books and the exports, and sends nothing.',
    },
    {
      icon: 'settings',
      title: 'Your rules',
      description: 'Terms, late fees, numbering and taxes, set once for every invoice.',
    },
  ],
};

export const TESTIMONIALS: { heading: string; lead: string; items: KtTestimonial[] } = {
  heading: 'What teams say',
  lead: 'From one-person studios to finance teams.',
  items: [
    {
      quote: 'We closed September in a day. It used to take the whole first week of October.',
      name: 'Ada Park',
      role: 'CFO, Kiln',
    },
    {
      quote: 'Reminders I never have to write, and clients who pay on time.',
      name: 'Sam Ortiz',
      role: 'Founder, Ortiz Studio',
    },
    {
      quote: 'The bank feed matches itself. I check it on Fridays out of habit.',
      name: 'Lena Brandt',
      role: 'Bookkeeper, Halcyon',
    },
  ],
};

export const PRICING: { heading: string; lead: string; yearlyNote: string; plans: KtPlan[] } = {
  heading: 'Pricing',
  lead: 'Start free. Pay when it pays for itself.',
  yearlyNote: 'Two months free',
  plans: [
    {
      id: 'starter',
      name: 'Starter',
      description: 'For one person getting paid.',
      price: { monthly: 0, yearly: 0 },
      features: ['10 invoices a month', 'Email reminders', 'Card payments'],
      href: '#start',
    },
    {
      id: 'team',
      name: 'Team',
      description: 'For a team that bills every week.',
      price: { monthly: 29, yearly: 290 },
      features: [
        'Unlimited invoices',
        'Reminders on your schedule',
        'Bank reconciliation',
        'Five seats',
      ],
      featured: true,
      action: 'Start a trial',
      href: '#start',
    },
    {
      id: 'scale',
      name: 'Scale',
      description: 'For finance teams with rules.',
      price: 'Custom',
      features: ['Everything in Team', 'Approvals', 'SSO and audit log'],
      action: 'Talk to sales',
      href: '#start',
    },
  ],
};

export const QUESTIONS: {
  heading: string;
  lead: string;
  items: KtFaqItem[];
  note: string;
  contact: string;
} = {
  heading: 'Questions',
  lead: 'What teams ask before they switch.',
  items: [
    {
      question: 'Can I cancel any time?',
      answer:
        'Yes, from Settings, in two clicks. You keep every invoice you sent, and can export them all.',
    },
    {
      question: 'Do you take card payments?',
      answer:
        'Cards, bank transfers and direct debits, in 34 currencies. The money lands in two days.',
    },
    {
      question: 'Can my accountant get in?',
      answer:
        'Invite them as a guest: they see the books and the exports, and cannot send anything.',
    },
    {
      question: 'Is there a contract?',
      answer:
        'No. Monthly plans run month to month; yearly plans are paid up front and refunded pro rata.',
    },
  ],
  note: 'Something else?',
  contact: 'mailto:hello@northwind.example',
};

export const CTA = {
  heading: 'Start sending invoices',
  lead: 'Your first invoice goes out in two minutes — the rest chase themselves.',
  primary: 'Start free',
  secondary: 'Talk to sales',
  secondaryHref: 'mailto:sales@northwind.example',
  note: 'Free for three months. No card needed.',
};

export const NEWSLETTER = {
  heading: 'Notes, monthly',
  lead: 'What we shipped, and what we learned.',
  note: 'One email a month. Unsubscribe in one click.',
};

export const FOOTER: { tagline: string; columns: KtFooterColumn[]; legal: string } = {
  tagline: 'Invoices that pay themselves.',
  columns: [
    {
      heading: 'Product',
      links: [
        { label: 'Features', href: '#features' },
        { label: 'Pricing', href: '#pricing' },
        { label: 'Questions', href: '#questions' },
      ],
    },
    {
      heading: 'Company',
      links: [
        { label: 'About', href: '#start' },
        { label: 'Contact', href: 'mailto:hello@northwind.example' },
      ],
    },
  ],
  legal: '© 2026 Northwind. Made with Kanto.',
};

/** A company's wordmark, drawn: replace with your customers' real logos. */
export function logoSrc(name: string): string {
  const width = name.length * 11 + 40;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} 28" width="${width}" height="28"><circle cx="12" cy="14" r="10" fill="#888"/><text x="30" y="20" font-family="system-ui, sans-serif" font-size="17" font-weight="700" fill="#888">${name}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
