import { useRef } from 'react';
import type { KtHeader } from 'kanto-ds';
import { scrollToSection, startTrial, subscribe } from './actions';
import {
  CTA,
  FEATURES,
  FOOTER,
  HERO,
  LOGOS,
  NAV,
  NEWSLETTER,
  PRICING,
  PRODUCT,
  QUESTIONS,
  TESTIMONIALS,
  logoSrc,
} from './content';

export function App() {
  const header = useRef<KtHeader>(null);
  return (
    <>
      <kt-header sticky ref={header}>
        <a slot="brand" className="brand" href="#top">
          {PRODUCT}
        </a>
        <nav className="nav">
          {NAV.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
        <nav slot="menu" className="menu" aria-label="Menu">
          {NAV.map((link) => (
            <a key={link.href} href={link.href} onClick={() => header.current?.closeMenu()}>
              {link.label}
            </a>
          ))}
        </nav>
        <kt-button slot="actions" onClick={() => scrollToSection('start')}>
          {HERO.primary}
        </kt-button>
      </kt-header>
      <main className="page" id="top">
        <kt-hero heading={HERO.heading} lead={HERO.lead}>
          <a slot="announcement" href="#features">
            {HERO.announcement}
          </a>
          <kt-button
            slot="actions"
            size="large"
            onClick={() => scrollToSection(HERO.primaryHref.slice(1))}
          >
            {HERO.primary}
          </kt-button>
          <kt-button
            slot="actions"
            size="large"
            variant="secondary"
            onClick={() => scrollToSection(HERO.secondaryHref.slice(1))}
          >
            {HERO.secondary}
          </kt-button>
          <span slot="note">{HERO.note}</span>
        </kt-hero>
        <kt-logo-cloud heading={LOGOS.heading}>
          {LOGOS.names.map((name) => (
            <img key={name} src={logoSrc(name)} alt={name} />
          ))}
        </kt-logo-cloud>
        <kt-feature-grid
          id="features"
          heading={FEATURES.heading}
          lead={FEATURES.lead}
          features={FEATURES.items}
        />
        <kt-testimonials
          heading={TESTIMONIALS.heading}
          lead={TESTIMONIALS.lead}
          testimonials={TESTIMONIALS.items}
        />
        <kt-pricing-table
          id="pricing"
          heading={PRICING.heading}
          lead={PRICING.lead}
          yearlyNote={PRICING.yearlyNote}
          plans={PRICING.plans}
        />
        <kt-faq
          id="questions"
          layout="split"
          heading={QUESTIONS.heading}
          lead={QUESTIONS.lead}
          items={QUESTIONS.items}
        >
          <span slot="note">
            {QUESTIONS.note} <a href={QUESTIONS.contact}>Ask us</a>.
          </span>
        </kt-faq>
        <kt-cta id="start" heading={CTA.heading} lead={CTA.lead}>
          <kt-button slot="actions" size="large" onClick={startTrial}>
            {CTA.primary}
          </kt-button>
          <kt-button
            slot="actions"
            size="large"
            variant="secondary"
            onClick={() => location.assign(CTA.secondaryHref)}
          >
            {CTA.secondary}
          </kt-button>
          <span slot="note">{CTA.note}</span>
        </kt-cta>
        <kt-newsletter
          variant="plain"
          layout="inline"
          align="start"
          heading={NEWSLETTER.heading}
          lead={NEWSLETTER.lead}
          onkt-subscribe={(event) => event.detail.wait(subscribe(event.detail.email))}
        >
          <span slot="note">{NEWSLETTER.note}</span>
        </kt-newsletter>
      </main>
      <kt-footer columns={FOOTER.columns}>
        <a slot="brand" className="brand" href="#top">
          {PRODUCT}
        </a>
        <span>{FOOTER.tagline}</span>
        <span slot="legal">{FOOTER.legal}</span>
      </kt-footer>
    </>
  );
}
