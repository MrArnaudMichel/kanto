import { css, html, nothing, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { KtElement, defineElement } from '#internal/kt-element';
import { blockHead, blockId, blockStyles } from '#internal/block';
import '../../core/kt-avatar/kt-avatar.js';

export interface KtTestimonial {
  readonly quote: string;
  readonly name: string;
  /** Their role and company: "CFO, Northwind". */
  readonly role?: string;
  /** A photo's URL; without one, the avatar shows their initials. */
  readonly avatar?: string;
}

export type KtTestimonialsLayout = 'grid' | 'single';

/**
 * What the people who use it say: a quote, and who said it.
 *
 * The quotes are data: `wall.testimonials = [{ quote, name, role, avatar }]`.
 * `grid`, the default, sets them in columns that pack quotes of any length;
 * `single` gives each the width of the page, in larger type — for one quote
 * that carries the section.
 *
 * @element kt-testimonials
 *
 * @csspart base - The section.
 * @csspart testimonial - One quote and who said it.
 *
 * @example
 * ```html
 * <kt-testimonials heading="What teams say"></kt-testimonials>
 * <script>
 *   wall.testimonials = [
 *     { quote: 'We closed the month in a day.', name: 'Ada Park', role: 'CFO, Northwind' },
 *   ];
 * </script>
 * ```
 */
export class KtTestimonials extends KtElement {
  static override styles = [
    KtElement.styles,
    blockStyles,
    css`
      .list {
        margin: 0;
        padding: 0;
        list-style: none;
        columns: 3 260px;
        column-gap: var(--gap-card);
      }
      .list > li {
        break-inside: avoid;
        margin-bottom: var(--gap-card);
      }

      figure {
        display: grid;
        gap: var(--gap-card);
        margin: 0;
        padding: calc(var(--padding-card) * 1.25);
        text-align: start;
        border: var(--border-width) solid var(--border-subtle);
        border-radius: var(--border-radius-card);
      }
      blockquote {
        margin: 0;
        color: var(--text-body);
        font: var(--font-normal-regular);
        font-size: calc(16px * var(--text-scale, 1));
        line-height: 1.6;
        text-wrap: pretty;
      }
      blockquote p {
        margin: 0;
      }
      blockquote p::before {
        content: '“';
      }
      blockquote p::after {
        content: '”';
      }

      figcaption {
        display: flex;
        gap: 12px;
        align-items: center;
        min-width: 0;
      }
      .who {
        display: grid;
        min-width: 0;
      }
      .name {
        color: var(--text-body);
        font: var(--font-normal-medium);
      }
      .role {
        color: var(--text-muted);
        font: var(--font-normal-small);
      }

      /* Single: each quote the width of the page, set large, on no card. */
      :host([layout='single']) .list {
        columns: auto;
        max-width: 820px;
        margin-inline: auto;
      }
      :host([layout='single']) .list > li {
        margin-bottom: calc(var(--gap-card) * 3);
      }
      :host([layout='single']) .list > li:last-child {
        margin-bottom: 0;
      }
      :host([layout='single']) figure {
        gap: calc(var(--gap-card) * 1.5);
        padding: 0;
        border: 0;
      }
      :host([layout='single'][align='center']) figure {
        justify-items: center;
        text-align: center;
      }
      :host([layout='single']) blockquote {
        font: 500 clamp(20px, 3cqi, 28px) / 1.4 var(--font-family-display);
        letter-spacing: -0.01em;
        text-wrap: balance;
      }
    `,
  ];

  @property({ type: String })
  heading = '';

  @property({ type: String })
  lead = '';

  /** `center` or `start`. */
  @property({ type: String, reflect: true })
  align: 'center' | 'start' = 'center';

  /** The quotes, in order. */
  @property({ attribute: false })
  testimonials: readonly KtTestimonial[] = [];

  /** `grid`: in packed columns. `single`: each the page's width, large. */
  @property({ type: String, reflect: true })
  layout: KtTestimonialsLayout = 'grid';

  /** The heading's level. */
  @property({ type: Number, attribute: 'heading-level' })
  headingLevel = 2;

  private readonly headingId = blockId('kt-testimonials');

  private testimonial(item: KtTestimonial): TemplateResult {
    return html`<li>
      <figure part="testimonial">
        <blockquote><p>${item.quote}</p></blockquote>
        <figcaption>
          <kt-avatar
            name=${item.name}
            src=${item.avatar ?? ''}
            size=${this.layout === 'single' ? 'large' : 'medium'}
            aria-hidden="true"
          ></kt-avatar>
          <span class="who">
            <span class="name">${item.name}</span>
            ${item.role ? html`<span class="role">${item.role}</span>` : nothing}
          </span>
        </figcaption>
      </figure>
    </li>`;
  }

  override render(): TemplateResult {
    return html`<section
      part="base"
      class="block"
      aria-labelledby=${this.heading ? this.headingId : nothing}
    >
      ${blockHead({ title: this.heading, lead: this.lead, level: this.headingLevel, id: this.headingId })}
      <ul class="list" role="list">
        ${this.testimonials.map((item) => this.testimonial(item))}
      </ul>
    </section>`;
  }
}

defineElement('kt-testimonials', KtTestimonials);

declare global {
  interface HTMLElementTagNameMap {
    'kt-testimonials': KtTestimonials;
  }
}
