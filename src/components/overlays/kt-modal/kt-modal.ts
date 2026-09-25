import { css, html, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { property, query } from 'lit/decorators.js';
import { KtElement, defineElement } from '#internal/kt-element';
import { emit } from '#internal/events';
import { hasAssignedContent } from '#internal/slots';
import { closeDialog, isBackdropClick, openModal } from '#internal/dialog';
import { strings } from '#internal/strings';
import '../../core/kt-button/kt-button.js';

export type KtModalSize = 'small' | 'medium' | 'large' | 'full';

/**
 * A centred dialog for anything that is not a yes/no question.
 *
 * `<kt-confirm-dialog>` asks one thing and offers two answers. This one holds
 * content — a compose window, a command palette, a picker — and lets you put
 * whatever you like in the footer.
 *
 * Built on the native `<dialog>`, so the top layer, focus containment, page
 * inertness and Escape all come from the platform rather than from a focus trap
 * that leaks.
 *
 * @element kt-modal
 *
 * @slot - The body.
 * @slot header - Replaces the `heading` attribute.
 * @slot footer - Actions. Hidden when empty.
 *
 * @csspart dialog - The `<dialog>`.
 * @csspart header - The header row.
 * @csspart body - The scrolling body.
 * @csspart footer - The action row.
 *
 * @fires kt-close - Dismissal requested. Cancelable, for an unsaved-changes guard.
 *
 * @example
 * ```html
 * <kt-modal open heading="Compose">
 *   <kt-textarea rows="6"></kt-textarea>
 *   <kt-button slot="footer" type="submit">Send</kt-button>
 * </kt-modal>
 * ```
 */
export class KtModal extends KtElement {
  static override styles = [
    KtElement.styles,
    css`
      :host {
        display: contents;
      }

      /* Closed by default — see kt-confirm-dialog.ts's identical comment: an unconditional \`display: flex\` here left a never-opened dialog occupying its centred box (\`opacity: 0\`, but still in flow and hit-testable), silently eating clicks meant for whatever sat underneath it on the page. */
      dialog {
        display: none;
        flex-direction: column;
        gap: var(--gap-modal);
        box-sizing: border-box;
        width: 560px;
        max-width: calc(100vw - 48px);
        max-height: calc(100vh - 96px);
        padding: var(--padding-modal);
        color: var(--text-body);
        background: var(--surface-card);
        border: var(--border-width) solid var(--border-subtle);
        border-radius: var(--radius-modal);
        opacity: 0;
        transform: translateY(8px);
        transition:
          transform var(--duration-normal) var(--easing-standard),
          opacity var(--duration-normal) var(--easing-standard),
          overlay var(--duration-normal) allow-discrete,
          display var(--duration-normal) allow-discrete;
      }

      :host([size='small']) dialog {
        width: 400px;
      }
      :host([size='large']) dialog {
        width: 760px;
      }
      :host([size='full']) dialog {
        width: calc(100vw - 48px);
        height: calc(100vh - 96px);
      }

      dialog[open] {
        display: flex;
        opacity: 1;
        transform: translateY(0);
      }

      @starting-style {
        dialog[open] {
          opacity: 0;
          transform: translateY(8px);
        }
      }

      dialog::backdrop {
        background: var(--color-backdrop, rgba(0, 0, 0, 0.45));
      }

      .header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: var(--gap-card);
      }

      .titles {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 0;
      }

      h2 {
        margin: 0;
        color: var(--text-body);
        font: var(--font-title-h6);
      }

      .description {
        margin: 0;
        color: var(--text-muted);
        font: var(--font-normal-regular);
      }

      .body {
        flex: 1 1 auto;
        min-height: 0;
        overflow: auto;
        scrollbar-width: thin;
      }

      .footer {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: flex-end;
        gap: var(--gap-button);
      }

      .footer.empty {
        display: none;
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

  @property({ type: String })
  heading = '';

  @property({ type: String })
  description = '';

  @property({ type: String, reflect: true })
  size: KtModalSize = 'medium';

  /** Hides the close button. Escape still works — a modal you cannot leave is a trap. */
  @property({ type: Boolean, attribute: 'no-close-button' })
  noCloseButton = false;

  /** Stops a backdrop click from dismissing. */
  @property({ type: Boolean, attribute: 'no-backdrop-close' })
  noBackdropClose = false;

  private hasFooter = false;

  override updated(changed: PropertyValues<this>): void {
    if (changed.has('open')) {
      if (this.open) openModal(this.dialog);
      else closeDialog(this.dialog);
    }
    this.readFooter();
  }

  private readFooter(): void {
    const next = hasAssignedContent(
      this.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="footer"]'),
    );
    if (next === this.hasFooter) return;
    this.hasFooter = next;
    this.requestUpdate();
  }

  /** Asks to close. A cancelled `kt-close` keeps the modal open. */
  requestClose(): void {
    const proceed = emit(this, 'kt-close');
    if (proceed.defaultPrevented) {
      if (!this.dialog.open) openModal(this.dialog);
      return;
    }
    this.open = false;
  }

  private onDialogClose(): void {
    if (this.open) this.requestClose();
  }

  private onDialogClick(event: MouseEvent): void {
    if (this.noBackdropClose) return;
    if (isBackdropClick(this.dialog, event)) this.requestClose();
  }

  override render(): TemplateResult {
    const hasHeader = Boolean(this.heading) || Boolean(this.description);

    return html`<dialog
      part="dialog"
      aria-label=${this.heading || nothing}
      @close=${this.onDialogClose}
      @click=${this.onDialogClick}
    >
      ${
        hasHeader || !this.noCloseButton
          ? html`<div part="header" class="header">
              <div class="titles">
                <slot name="header">
                  ${this.heading ? html`<h2>${this.heading}</h2>` : nothing}
                </slot>
                ${this.description ? html`<p class="description">${this.description}</p>` : nothing}
              </div>
              ${
                this.noCloseButton
                  ? nothing
                  : html`<kt-button
                      variant="secondary-no-bg"
                      size="small"
                      icon="x"
                      label=${strings().close}
                      @click=${this.requestClose}
                    ></kt-button>`
              }
            </div>`
          : nothing
      }

      <div part="body" class="body"><slot></slot></div>

      <div part="footer" class=${this.hasFooter ? 'footer' : 'footer empty'}>
        <slot name="footer" @slotchange=${this.readFooter}></slot>
      </div>
    </dialog>`;
  }
}

defineElement('kt-modal', KtModal);

declare global {
  interface HTMLElementTagNameMap {
    'kt-modal': KtModal;
  }
}
