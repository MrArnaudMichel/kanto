import { css, html, nothing, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { KtElement, defineElement } from 'kanto-ds/internal/kt-element';
import { emit } from 'kanto-ds/internal/events';
import '../../core/kt-icon/kt-icon.js';

/**
 * A section that folds away.
 *
 * Built on `<details>`, which means it works before the JavaScript loads,
 * survives find-in-page — the browser opens a closed section to reveal a match —
 * and needs no ARIA of its own.
 *
 * @element kt-collapsible
 *
 * @slot - The contents.
 * @slot summary - Replaces the `heading` attribute.
 *
 * @csspart base - The `<details>`.
 * @csspart summary - The clickable row.
 * @csspart content - The revealed panel.
 *
 * @fires kt-toggle - Opened or closed. `detail: { open }`.
 *
 * @example
 * ```html
 * <kt-collapsible heading="Notifications" open>
 *   <kt-toggle checked>Email me about mentions</kt-toggle>
 * </kt-collapsible>
 * ```
 */
export class KtCollapsible extends KtElement {
  static override styles = [
    KtElement.styles,
    css`
      :host {
        display: block;
      }

      details {
        border-bottom: var(--border-width) solid var(--border-subtle);
      }

      :host([plain]) details {
        border-bottom: none;
      }

      summary {
        display: flex;
        align-items: center;
        gap: var(--gap-button);
        padding: 12px 0;
        color: var(--text-body);
        font: var(--font-normal-medium);
        cursor: pointer;
        list-style: none;
      }

      /* The default marker is a triangle nobody asked for. */
      summary::-webkit-details-marker {
        display: none;
      }

      summary:hover {
        color: var(--text-body);
      }

      summary:focus-visible {
        outline: var(--outline-width) solid var(--color-primary-base);
        outline-offset: 2px;
        border-radius: 4px;
      }

      .chevron {
        display: inline-flex;
        flex: none;
        color: var(--text-muted);
        transition: transform var(--duration-fast) var(--easing-standard);
      }

      details[open] .chevron {
        transform: rotate(90deg);
      }

      .label {
        flex: 1;
        min-width: 0;
      }

      .content {
        padding: 0 0 16px;
        color: var(--text-muted);
      }
    `,
  ];

  @property({ type: Boolean, reflect: true })
  open = false;

  @property({ type: String })
  heading = '';

  /** Drops the bottom rule, for a collapsible that is not part of a list. */
  @property({ type: Boolean, reflect: true })
  plain = false;

  private onToggle(event: Event): void {
    const details = event.target as HTMLDetailsElement;
    if (details.open === this.open) return;

    this.open = details.open;
    emit(this, 'kt-toggle', { open: this.open });
  }

  override render(): TemplateResult {
    return html`<details part="base" ?open=${this.open} @toggle=${this.onToggle}>
      <summary part="summary">
        <span class="chevron"><kt-icon name="chevron-right" size="16"></kt-icon></span>
        <span class="label"><slot name="summary">${this.heading || nothing}</slot></span>
      </summary>
      <div part="content" class="content"><slot></slot></div>
    </details>`;
  }
}

defineElement('kt-collapsible', KtCollapsible);

declare global {
  interface HTMLElementTagNameMap {
    'kt-collapsible': KtCollapsible;
  }
}
