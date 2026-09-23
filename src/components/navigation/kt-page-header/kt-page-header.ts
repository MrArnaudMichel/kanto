import { css, html, nothing, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { KtElement, defineElement } from '#internal/kt-element';

/**
 * The block every screen opens with: an overline, a title, a sentence, and the
 * actions that belong to the page rather than to anything on it.
 *
 * It exists because it was being rebuilt on every screen, and the copies drifted
 * — different heading levels, different gaps, actions sometimes above and
 * sometimes beside. Those are not decisions worth making twice.
 *
 * At `level="section"` the same block introduces a region inside a page: a
 * smaller heading, and the action is usually a link onward rather than a button.
 *
 * @element kt-page-header
 *
 * @slot - Extra content under the description.
 * @slot actions - Buttons or a link, trailing on wide screens.
 *
 * @csspart base - The container.
 * @csspart heading - The heading element.
 *
 * @example
 * ```html
 * <kt-page-header eyebrow="Dashboard" heading="Good evening"
 *                 description="Recent files, integrations and activity.">
 *   <kt-button slot="actions" icon="plus">New document</kt-button>
 * </kt-page-header>
 *
 * <kt-page-header level="section" heading="Recently opened">
 *   <a slot="actions" href="#/files">See all files</a>
 * </kt-page-header>
 * ```
 */
export class KtPageHeader extends KtElement {
  static override styles = [
    KtElement.styles,
    css`
      :host {
        display: block;
      }

      .header {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-end;
        justify-content: space-between;
        gap: 16px;
      }

      .copy {
        display: flex;
        flex: 1 1 320px;
        flex-direction: column;
        gap: 4px;
        min-width: 0;
      }

      .eyebrow {
        color: var(--text-muted);
        font: var(--font-title-overline);
        letter-spacing: var(--letter-spacing-overline);
        text-transform: uppercase;
      }

      h1 {
        margin: 0;
        color: var(--text-body);
        font: var(--font-title-h1);
      }

      h2 {
        margin: 0;
        color: var(--text-body);
        font: var(--font-title-h5);
      }

      .description {
        max-width: 72ch;
        margin: 0;
        color: var(--text-muted);
        font: var(--font-normal-regular);
        line-height: 1.6;
      }

      .actions {
        display: flex;
        flex: none;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--gap-button);
      }

      /* A section header sits tight against what it introduces. */
      :host([level='section']) .header {
        align-items: center;
      }

      :host([level='section']) .description {
        font: var(--font-normal-small);
      }
    `,
  ];

  /** Small uppercase label above the heading — "Dashboard", "Settings". */
  @property({ type: String })
  eyebrow = '';

  @property({ type: String })
  heading = '';

  @property({ type: String })
  description = '';

  /** `page` renders an `<h1>`; `section` an `<h2>` at body scale. */
  @property({ type: String, reflect: true })
  level: 'page' | 'section' = 'page';

  override render(): TemplateResult {
    const title = this.heading
      ? this.level === 'section'
        ? html`<h2 part="heading">${this.heading}</h2>`
        : html`<h1 part="heading">${this.heading}</h1>`
      : nothing;

    return html`<div part="base" class="header">
      <div class="copy">
        ${this.eyebrow ? html`<span class="eyebrow">${this.eyebrow}</span>` : nothing} ${title}
        ${this.description ? html`<p class="description">${this.description}</p>` : nothing}
        <slot></slot>
      </div>
      <div class="actions"><slot name="actions"></slot></div>
    </div>`;
  }
}

defineElement('kt-page-header', KtPageHeader);

declare global {
  interface HTMLElementTagNameMap {
    'kt-page-header': KtPageHeader;
  }
}
