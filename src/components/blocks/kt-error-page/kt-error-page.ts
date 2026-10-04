import { css, html, nothing, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { KtElement, defineElement } from '#internal/kt-element';
import { emit } from '#internal/events';
import { heading } from '#internal/heading';
import { hasAssignedContent } from '#internal/slots';
import '../../core/kt-button/kt-button.js';

export type KtErrorPageKind = 'not-found' | 'error' | 'maintenance';

/** Every word the page says, in English until given others. */
export interface KtErrorPageTexts {
  readonly notFoundHeading: string;
  readonly notFoundLead: string;
  readonly errorHeading: string;
  readonly errorLead: string;
  readonly maintenanceHeading: string;
  readonly maintenanceLead: string;
  readonly goHome: string;
  readonly tryAgain: string;
}

const TEXTS: KtErrorPageTexts = {
  notFoundHeading: 'Page not found',
  notFoundLead:
    'The page you were looking for has moved, or never was. Check the address, or start again from home.',
  errorHeading: 'Something went wrong',
  errorLead:
    'It is on our side, not yours. Try again in a moment; if it keeps happening, we are already on it.',
  maintenanceHeading: 'Back in a moment',
  maintenanceLead:
    'We are making things better. The page will be back shortly — nothing you have done is lost.',
  goHome: 'Go home',
  tryAgain: 'Try again',
};

const CODES: Record<KtErrorPageKind, string> = {
  'not-found': '404',
  error: '500',
  maintenance: '503',
};

/**
 * The page a person lands on when the one they wanted is not there: not found,
 * broken, or down for maintenance — said plainly, with the way on.
 *
 * `not-found` leads home (`home-href`); `error` offers to try again, firing
 * `kt-retry` — cancel it to retry your own way, otherwise the page reloads;
 * `maintenance` offers nothing it cannot do. The `actions` slot replaces the
 * buttons. Every word is in `texts`, English until given others.
 *
 * @element kt-error-page
 *
 * @slot actions - Replaces the buttons: a search, a link to the status page.
 * @slot - Under the actions: a contact line, a request id.
 *
 * @csspart base - The block.
 * @csspart code - The code, large.
 *
 * @fires kt-retry - Try again was pressed. Cancelable; uncancelled, the page reloads.
 *
 * @example
 * ```html
 * <kt-error-page fill home-href="/app"></kt-error-page>
 * <kt-error-page kind="error"></kt-error-page>
 * ```
 */
export class KtErrorPage extends KtElement {
  static override styles = [
    KtElement.styles,
    css`
      :host {
        display: block;
      }
      :host([fill]) {
        display: grid;
        min-height: 100%;
        place-items: center;
      }

      .page {
        display: grid;
        gap: var(--gap-card);
        justify-items: center;
        max-width: 560px;
        margin: 0 auto;
        padding: calc(var(--padding-card) * 2) var(--padding-card);
        text-align: center;
      }

      .code {
        color: var(--color-primary-text);
        font: 600 clamp(64px, 12vw, 120px) / 1 var(--font-family-display);
        letter-spacing: -0.04em;
      }
      .heading {
        margin: 0;
        color: var(--text-body);
        font: var(--font-title-h3);
        text-wrap: balance;
      }
      .lead {
        max-width: 46ch;
        margin: 0;
        color: var(--text-muted);
        font: var(--font-normal-regular);
        line-height: 1.6;
        text-wrap: pretty;
      }

      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--gap-button);
        justify-content: center;
      }
      .actions:empty,
      .actions[hidden] {
        display: none;
      }

      /* Home is a link, drawn as the primary button. */
      .home {
        display: inline-flex;
        align-items: center;
        height: var(--button-height);
        padding: 0 var(--button-padding-x);
        color: var(--color-white);
        font: var(--font-normal-regular);
        text-decoration: none;
        background-color: var(--color-primary-base);
        border-radius: var(--border-radius);
        transition: background-color var(--duration-instant);
      }
      .home:hover {
        background-color: var(--color-primary-hover);
      }
      /* Second to Try again: a link, not a second primary button. */
      .home.quiet,
      .home.quiet:hover {
        color: var(--color-primary-text);
        background-color: transparent;
      }
      .home:focus-visible {
        outline: var(--outline-width) solid var(--color-primary-base);
        outline-offset: 2px;
      }

      .more {
        color: var(--text-muted);
        font: var(--font-normal-small);
      }
      .more:empty {
        display: none;
      }
    `,
  ];

  /** `not-found`, `error` or `maintenance`. */
  @property({ type: String, reflect: true })
  kind: KtErrorPageKind = 'not-found';

  /** The code shown large. Defaults to the kind's: 404, 500, 503. */
  @property({ type: String })
  code = '';

  /** Where Go home leads. */
  @property({ type: String, attribute: 'home-href' })
  homeHref = '/';

  /** The heading's level, 1 to 6: 1 when it is the page. */
  @property({ type: Number, attribute: 'heading-level' })
  headingLevel = 1;

  /** Fills its container's height and centres itself in it. */
  @property({ type: Boolean, reflect: true })
  fill = false;

  /** The words, English until given others. */
  @property({ attribute: false })
  texts: Partial<KtErrorPageTexts> = {};

  @state() private ownActions = false;

  override firstUpdated(): void {
    this.readActions();
  }

  private readActions(): void {
    this.ownActions = hasAssignedContent(this.shadowRoot?.querySelector('slot[name="actions"]'));
  }

  private retry(): void {
    const event = emit(this, 'kt-retry');
    if (!event.defaultPrevented) location.reload();
  }

  override render(): TemplateResult {
    const t = { ...TEXTS, ...this.texts };
    const words: Record<KtErrorPageKind, readonly [string, string]> = {
      'not-found': [t.notFoundHeading, t.notFoundLead],
      error: [t.errorHeading, t.errorLead],
      maintenance: [t.maintenanceHeading, t.maintenanceLead],
    };
    const [title, lead] = words[this.kind] ?? words['not-found'];
    const defaults =
      this.kind === 'maintenance'
        ? nothing
        : html`${
              this.kind === 'error'
                ? html`<kt-button @click=${() => this.retry()}>${t.tryAgain}</kt-button>`
                : nothing
            }
            <a class=${this.kind === 'error' ? 'home quiet' : 'home'} href=${this.homeHref}
              >${t.goHome}</a
            >`;
    return html`<section part="base" class="page">
      <div part="code" class="code" aria-hidden="true">${this.code || CODES[this.kind]}</div>
      ${heading(this.headingLevel, title, 'heading', 1)}
      <p class="lead">${lead}</p>
      <div class="actions">
        <slot name="actions" @slotchange=${this.readActions}></slot>
        ${this.ownActions ? nothing : defaults}
      </div>
      <div class="more"><slot></slot></div>
    </section>`;
  }
}

defineElement('kt-error-page', KtErrorPage);

declare global {
  interface HTMLElementTagNameMap {
    'kt-error-page': KtErrorPage;
  }
}
