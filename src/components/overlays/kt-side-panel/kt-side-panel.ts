import { css, html, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { property, query } from 'lit/decorators.js';
import { KtElement, defineElement } from '../../../internal/kt-element.js';
import { emit } from '../../../internal/events.js';
import { closeDialog, isBackdropClick, openModal } from '../../../internal/dialog.js';
import '../../core/kt-button/kt-button.js';

/**
 * A drawer that slides in from the right, for viewing or editing one record
 * without leaving the list behind it.
 *
 * Built on the native `<dialog>`: the panel lands in the top layer, focus is
 * trapped inside it, the page behind goes inert, and Escape closes it — none of
 * which the fixed-position div this replaces did.
 *
 * @element kt-side-panel
 *
 * @slot - The panel body.
 * @slot footer - Pinned below the body.
 *
 * @csspart dialog - The `<dialog>`.
 * @csspart header - The header row.
 * @csspart body - The scrolling body.
 *
 * @fires kt-close - The panel was dismissed. Cancelable: cancel it to keep the
 *   panel open, for an unsaved-changes prompt.
 *
 * @example
 * ```html
 * <kt-side-panel open eyebrow="Details" heading="Entity 4812">
 *   <p>…</p>
 * </kt-side-panel>
 * ```
 */
export class KtSidePanel extends KtElement {
  static override styles = [
    KtElement.styles,
    css`
      :host {
        display: contents;
      }

      dialog {
        position: fixed;
        top: 0;
        right: 0;
        left: auto;
        display: flex;
        flex-direction: column;
        gap: var(--gap-drag-drop);
        box-sizing: border-box;
        width: 308px;
        max-width: 100%;
        height: 100vh;
        max-height: 100vh;
        margin: 0;
        padding: var(--padding-card);
        overflow: hidden;
        color: var(--text-body);
        background-color: var(--surface-card);
        border: none;
        transform: translateX(100%);
        transition:
          transform var(--duration-normal) var(--easing-standard),
          overlay var(--duration-normal) allow-discrete,
          display var(--duration-normal) allow-discrete;
      }

      dialog[open] {
        transform: translateX(0);
      }

      /* The panel starts off-screen on open, so the slide runs the first time
         too rather than only on close. */
      @starting-style {
        dialog[open] {
          transform: translateX(100%);
        }
      }

      dialog::backdrop {
        background: var(--color-backdrop, rgba(0, 0, 0, 0.45));
      }

      .header {
        display: flex;
        flex: 0 0 auto;
        align-items: center;
        justify-content: space-between;
        gap: var(--gap-drag-drop);
      }

      .titles {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .eyebrow {
        color: var(--text-muted);
        font: var(--font-normal-small);
        letter-spacing: 1px;
        text-transform: uppercase;
      }

      h2 {
        margin: 0;
        color: var(--text-body);
        font: var(--font-title-h6);
      }

      .divider {
        width: 100%;
        margin: 0;
        border: 0;
        border-bottom: var(--border-width) solid var(--border-subtle);
      }

      .body {
        flex: 1 1 auto;
        overflow: auto;
      }

      @media (prefers-reduced-motion: reduce) {
        dialog {
          transition: none;
        }
      }
    `,
  ];

  @query('dialog')
  private dialog!: HTMLDialogElement;

  @property({ type: Boolean, reflect: true })
  open = false;

  /** Small uppercase label above the heading — "Details", "Editing". */
  @property({ type: String })
  eyebrow = 'Details';

  @property({ type: String })
  heading = '';

  /** Suppresses dismissal by backdrop click. Escape still works, by design. */
  @property({ type: Boolean, attribute: 'no-backdrop-close' })
  noBackdropClose = false;

  override updated(changed: PropertyValues<this>): void {
    if (!changed.has('open')) return;
    if (this.open) openModal(this.dialog);
    else closeDialog(this.dialog);
  }

  /** Asks to close. A cancelled `kt-close` keeps the panel open. */
  requestClose(): void {
    const proceed = emit(this, 'kt-close');
    if (proceed.defaultPrevented) {
      // The dialog may already have closed itself — Escape does that natively.
      if (!this.dialog.open) openModal(this.dialog);
      return;
    }
    this.open = false;
  }

  /** Escape and the native close both land here. */
  private onDialogClose(): void {
    if (this.open) this.requestClose();
  }

  private onDialogClick(event: MouseEvent): void {
    if (this.noBackdropClose) return;
    if (isBackdropClick(this.dialog, event)) this.requestClose();
  }

  override render(): TemplateResult {
    return html`<dialog
      part="dialog"
      aria-label=${this.heading || nothing}
      @close=${this.onDialogClose}
      @click=${this.onDialogClick}
    >
      <div part="header" class="header">
        <div class="titles">
          ${this.eyebrow ? html`<div class="eyebrow">${this.eyebrow}</div>` : nothing}
          <h2>${this.heading}</h2>
        </div>
        <kt-button
          variant="secondary"
          size="small"
          icon="x"
          label="Close"
          @click=${this.requestClose}
        ></kt-button>
      </div>

      <hr class="divider" />

      <div part="body" class="body"><slot></slot></div>
      <slot name="footer"></slot>
    </dialog>`;
  }
}

defineElement('kt-side-panel', KtSidePanel);

declare global {
  interface HTMLElementTagNameMap {
    'kt-side-panel': KtSidePanel;
  }
}
