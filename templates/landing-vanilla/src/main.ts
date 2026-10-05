import 'kanto-ds';
import 'kanto-ds/styles.css';
import './styles.css';
import type {
  KtFaq,
  KtFeatureGrid,
  KtFooter,
  KtHero,
  KtNewsletter,
  KtPricingTable,
  KtSubscribeDetail,
  KtTestimonials,
} from 'kanto-ds';
import { scrollToSection, subscribe } from './actions';
import { applyBrand } from './brand';
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

applyBrand();

const app = document.querySelector<HTMLElement>('#app')!;
app.innerHTML = `
  <kt-header sticky>
    <a slot="brand" class="brand" href="#top"></a>
    <nav class="nav"></nav>
    <kt-button slot="actions" class="start"></kt-button>
  </kt-header>
  <main class="page" id="top">
    <kt-hero>
      <a slot="announcement" class="announcement" href="#features"></a>
      <kt-button slot="actions" size="large" class="hero-primary"></kt-button>
      <kt-button slot="actions" size="large" variant="secondary" class="hero-secondary"></kt-button>
      <span slot="note" class="hero-note"></span>
    </kt-hero>
    <kt-logo-cloud></kt-logo-cloud>
    <kt-feature-grid id="features"></kt-feature-grid>
    <kt-testimonials></kt-testimonials>
    <kt-pricing-table id="pricing"></kt-pricing-table>
    <kt-faq id="questions" layout="split">
      <span slot="note"><span class="faq-note"></span> <a class="faq-contact">Ask us</a>.</span>
    </kt-faq>
    <kt-cta id="start">
      <kt-button slot="actions" size="large" class="cta-primary"></kt-button>
      <kt-button slot="actions" size="large" variant="secondary" class="cta-secondary"></kt-button>
      <span slot="note" class="cta-note"></span>
    </kt-cta>
    <kt-newsletter variant="plain" layout="inline" align="start">
      <span slot="note" class="newsletter-note"></span>
    </kt-newsletter>
  </main>
  <kt-footer>
    <a slot="brand" class="brand" href="#top"></a>
    <span class="footer-tagline"></span>
    <span slot="legal" class="footer-legal"></span>
  </kt-footer>`;

const $ = <T extends Element>(selector: string) => app.querySelector<T>(selector)!;
const text = (selector: string, value: string) => {
  for (const node of app.querySelectorAll(selector)) node.textContent = value;
};

// Header
text('.brand', PRODUCT);
$('.nav').replaceChildren(
  ...NAV.map((link) =>
    Object.assign(document.createElement('a'), { href: link.href, textContent: link.label }),
  ),
);
text('.start', HERO.primary);
$('.start').addEventListener('click', () => scrollToSection('start'));

// Hero
Object.assign($<KtHero>('kt-hero'), { heading: HERO.heading, lead: HERO.lead });
text('.announcement', HERO.announcement);
text('.hero-primary', HERO.primary);
text('.hero-secondary', HERO.secondary);
text('.hero-note', HERO.note);
$('.hero-primary').addEventListener('click', () => scrollToSection(HERO.primaryHref.slice(1)));
$('.hero-secondary').addEventListener('click', () => scrollToSection(HERO.secondaryHref.slice(1)));

// Logos
const logos = $('kt-logo-cloud');
logos.setAttribute('heading', LOGOS.heading);
logos.replaceChildren(
  ...LOGOS.names.map((name) =>
    Object.assign(document.createElement('img'), { src: logoSrc(name), alt: name }),
  ),
);

// Features, testimonials, pricing, questions
Object.assign($<KtFeatureGrid>('kt-feature-grid'), {
  heading: FEATURES.heading,
  lead: FEATURES.lead,
  features: FEATURES.items,
});
Object.assign($<KtTestimonials>('kt-testimonials'), {
  heading: TESTIMONIALS.heading,
  lead: TESTIMONIALS.lead,
  testimonials: TESTIMONIALS.items,
});
Object.assign($<KtPricingTable>('kt-pricing-table'), {
  heading: PRICING.heading,
  lead: PRICING.lead,
  yearlyNote: PRICING.yearlyNote,
  plans: PRICING.plans,
});
Object.assign($<KtFaq>('kt-faq'), {
  heading: QUESTIONS.heading,
  lead: QUESTIONS.lead,
  items: QUESTIONS.items,
});
text('.faq-note', QUESTIONS.note);
$<HTMLAnchorElement>('.faq-contact').href = QUESTIONS.contact;

// The closing call to action
const cta = $('kt-cta');
cta.setAttribute('heading', CTA.heading);
cta.setAttribute('lead', CTA.lead);
text('.cta-primary', CTA.primary);
text('.cta-secondary', CTA.secondary);
text('.cta-note', CTA.note);
$('.cta-secondary').addEventListener('click', () => location.assign(CTA.secondaryHref));

// Newsletter
const newsletter = $<KtNewsletter>('kt-newsletter');
Object.assign(newsletter, { heading: NEWSLETTER.heading, lead: NEWSLETTER.lead });
text('.newsletter-note', NEWSLETTER.note);
newsletter.addEventListener('kt-subscribe', (event) => {
  const { email, wait } = (event as CustomEvent<KtSubscribeDetail>).detail;
  wait(subscribe(email));
});

// Footer
Object.assign($<KtFooter>('kt-footer'), { columns: FOOTER.columns });
text('.footer-tagline', FOOTER.tagline);
text('.footer-legal', FOOTER.legal);
