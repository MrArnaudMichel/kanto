import { css, html, nothing, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { KtElement, defineElement } from '#internal/kt-element';
import { blockHead, blockId, blockStyles } from '#internal/block';
import { heading } from '#internal/heading';
import '../../core/kt-icon/kt-icon.js';

export interface KtFeature {
  /** An icon's name, drawn in a tinted square over the title. */
  readonly icon?: string;
  readonly title: string;
  readonly description: string;
  /** Makes the title a link: where to read more. */
  readonly href?: string;
}

export type KtFeatureGridVariant = 'plain' | 'card';

/**
 * What the product does, a feature at a time: an icon, a title and a line,
 * in a grid.
 *
 * The features are data: `grid.features = [{ icon, title, description, href }]`,
 * drawn as a list. `columns` sets how many per row where there is room — a
 * narrow grid is one column; `card` puts each feature on a card.
 *
 * @element kt-feature-grid
 *
 * @csspart base - The section.
 * @csspart list - The `<ul>`.
 * @csspart feature - One feature.
 *
 * @example
 * ```html
 * <kt-feature-grid heading="Why teams switch" lead="Less chasing, more paid."></kt-feature-grid>
 * <script>
 *   grid.features = [
 *     { icon: 'send', title: 'Sent in a second', description: 'From the quote, in one click.' },
 *   ];
 * </script>
 * ```
 */
export class KtFeatureGrid extends KtElement {
  static override styles = [
    KtElement.styles,
    blockStyles,
    css`
      :host {
        --kt-feature-columns: 3;
      }
      :host([columns='2']) {
        --kt-feature-columns: 2;
      }
      :host([columns='4']) {
        --kt-feature-columns: 4;
      }

      .list {
        display: grid;
        grid-template-columns: repeat(var(--kt-feature-columns), minmax(0, 1fr));
        gap: calc(var(--gap-card) * 2) calc(var(--gap-card) * 1.5);
        margin: 0;
        padding: 0;
        list-style: none;
      }
      /* Two columns before one: four or three would be cramped. */
      @container (max-width: 760px) {
        .list {
          grid-template-columns: repeat(min(2, var(--kt-feature-columns)), minmax(0, 1fr));
        }
      }
      @container (max-width: 480px) {
        .list {
          grid-template-columns: minmax(0, 1fr);
        }
      }

      .feature {
        position: relative;
        display: grid;
        align-content: start;
        gap: 8px;
        min-width: 0;
        text-align: start;
      }
      :host([variant='card']) .feature {
        padding: var(--padding-card);
        border: var(--border-width) solid var(--border-subtle);
        border-radius: var(--border-radius-card);
        transition: border-color var(--duration-instant);
      }
      :host([variant='card']) .feature:has(a):hover {
        border-color: var(--color-primary-base);
      }

      .icon {
        display: grid;
        place-items: center;
        width: 40px;
        height: 40px;
        margin-bottom: 4px;
        color: var(--color-primary-text);
        background-color: var(--color-primary-soft);
        border-radius: var(--border-radius);
      }

      .title {
        margin: 0;
        color: var(--text-body);
        font: var(--font-title-h6);
      }
      .title a {
        color: inherit;
        text-decoration: none;
      }
      /* The whole feature answers the link. */
      .title a::after {
        position: absolute;
        inset: 0;
        border-radius: inherit;
        content: '';
      }
      .title a:hover {
        color: var(--color-primary-text);
      }
      .feature:has(a:focus-visible) {
        border-radius: var(--border-radius-card);
        outline: var(--outline-width) solid var(--color-primary-base);
        outline-offset: 4px;
      }
      .title a:focus-visible {
        outline: none;
      }

      .description {
        margin: 0;
        color: var(--text-muted);
        font: var(--font-normal-regular);
        line-height: 1.6;
        text-wrap: pretty;
      }
    `,
  ];

  @property({ type: String })
  heading = '';

  @property({ type: String })
  lead = '';

  /** `center` or `start`: the head over the grid. */
  @property({ type: String, reflect: true })
  align: 'center' | 'start' = 'center';

  /** The features, drawn in order. */
  @property({ attribute: false })
  features: readonly KtFeature[] = [];

  /** Features per row, where there is room: 2, 3 or 4. */
  @property({ type: Number, reflect: true })
  columns: 2 | 3 | 4 = 3;

  /** `plain`, or `card`: each feature on a card. */
  @property({ type: String, reflect: true })
  variant: KtFeatureGridVariant = 'plain';

  /** The heading's level; the features' titles sit one under. */
  @property({ type: Number, attribute: 'heading-level' })
  headingLevel = 2;

  private readonly headingId = blockId('kt-feature-grid');

  private feature(feature: KtFeature): TemplateResult {
    const title = feature.href
      ? html`<a href=${feature.href}>${feature.title}</a>`
      : html`${feature.title}`;
    return html`<li part="feature" class="feature">
      ${
        feature.icon
          ? html`<span class="icon" aria-hidden="true"
              ><kt-icon name=${feature.icon} size="20"></kt-icon
            ></span>`
          : nothing
      }
      ${heading(this.headingLevel + 1, title, 'title', 3)}
      <p class="description">${feature.description}</p>
    </li>`;
  }

  override render(): TemplateResult {
    return html`<section
      part="base"
      class="block"
      aria-labelledby=${this.heading ? this.headingId : nothing}
    >
      ${blockHead({ title: this.heading, lead: this.lead, level: this.headingLevel, id: this.headingId })}
      <ul part="list" class="list" role="list">
        ${this.features.map((feature) => this.feature(feature))}
      </ul>
    </section>`;
  }
}

defineElement('kt-feature-grid', KtFeatureGrid);

declare global {
  interface HTMLElementTagNameMap {
    'kt-feature-grid': KtFeatureGrid;
  }
}
