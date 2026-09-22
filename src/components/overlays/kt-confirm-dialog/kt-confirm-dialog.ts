import { css, html, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { property, query } from 'lit/decorators.js';
import { KtElement, defineElement } from '#internal/kt-element';
import { emit } from '#internal/events';
import { closeDialog, isBackdropClick, openModal } from '#internal/dialog';
import '../../core/kt-button/kt-button.js';

export type KtConfirmVariant = 'danger' | 'primary';

/**
 * A centred yes/no overlay, for an action worth stopping to think about.
 *
 * Confirmations are for destructive or irreversible work. Editing belongs in a
 * `<kt-side-panel>`, which does not block the page behind it.
 *
 * `role="alertdialog"` and the cancel button takes focus on open, so a stray
 * Enter dismisses rather than confirms.
 *
 * @element kt-confirm-dialog
 *
 * @slot - Extra content between the message and the buttons.
 *
 * @csspart dialog - The `<dialog>`.
 * @csspart actions - The button row.
 *
 * @fires kt-confirm - The confirm button was pressed.
 * @fires kt-cancel - Dismissed, by button, Escape or backdrop.
 *
 * @example
 * ```html
 * <kt-confirm-dialog
 *   heading="Delete this entity?"
 *   message="This action cannot be undone."
 *   confirm-label="Delete"
 * ></kt-confirm-dialog>
 * ```
 */
export class KtConfirmDialog extends KtElement {
  static override styles = [
    KtElement.styles,
    css`
      :host {
        display: contents;
      }

      /*
       * Closed by default (\`display: none\`, the native UA default a plain
       * \`dialog\` selector here would otherwise override): before this,
       * \`display: flex\` applied unconditionally, so a \`<kt-confirm-dialog>\`
       * that had never been opened still rendered its \`<dialog>\` in normal
       * flow — \`opacity: 0\` hides it, but does not stop it from occupying
       * its box or intercepting clicks meant for whatever sits underneath.
       * Verified against a real page: a closed dialog several screens away
       * from where it was declared silently ate clicks on the content
       * behind it. \`display\` is already in the transition list below with
       * \`allow-discrete\` for exactly this swap — switching \`dialog[open]\`
       * to set \`display: flex\` is what makes that transition real instead
       * of a no-op, and the close animation (opacity/transform) still plays
       * in full before \`display\` flips back to \`none\`.
       */
      dialog {
        display: none;
        flex-direction: column;
        gap: var(--gap-modal);
        box-sizing: border-box;
        width: 400px;
        max-width: calc(100vw - 48px);
        padding: var(--padding-modal);
        color: var(--text-body);
        background: var(--surface-card);
        border: var(--border-width) solid var(--border-subtle);
        border-radius: var(--radius-modal);
        transform: translateY(8px);
        opacity: 0;
        transition:
          transform var(--duration-normal) var(--easing-standard),
          opacity var(--duration-normal) var(--easing-standard),
          overlay var(--duration-normal) allow-discrete,
          display var(--duration-normal) allow-discrete;
      }

      dialog[open] {
        display: flex;
        transform: translateY(0);
        opacity: 1;
      }

      @starting-style {
        dialog[open] {
          transform: translateY(8px);
          opacity: 0;
        }
      }

      dialog::backdrop {
        background: var(--color-backdrop, rgba(0, 0, 0, 0.45));
      }

      h2 {
        margin: 0;
        color: var(--text-body);
        font: var(--font-title-h6);
      }

      p {
        margin: 0;
        color: var(--text-muted);
        font: var(--font-normal-regular);
      }

      .actions {
        display: flex;
        justify-content: flex-end;
        gap: var(--gap-button);
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

  @query('kt-button[data-cancel]')
  private cancelButton!: HTMLElement | null;

  @property({ type: Boolean, reflect: true })
  open = false;

  @property({ type: String })
  heading = 'Are you sure?';

  @property({ type: String })
  message = '';

  @property({ type: String, attribute: 'confirm-label' })
  confirmLabel = 'Confirm';

  @property({ type: String, attribute: 'cancel-label' })
  cancelLabel = 'Cancel';

  /** `danger` gives the confirm button the solid red treatment. */
  @property({ type: String, reflect: true })
  variant: KtConfirmVariant = 'danger';

  override updated(changed: PropertyValues<this>): void {
    if (!changed.has('open')) return;

    if (this.open) {
      openModal(this.dialog);
      // Focus lands on Cancel, not Confirm: an Enter meant for whatever was
      // behind the dialog should not delete anything.
      this.cancelButton?.focus();
    } else {
      closeDialog(this.dialog);
    }
  }

  private confirm(): void {
    this.open = false;
    emit(this, 'kt-confirm');
  }

  private cancel(): void {
    this.open = false;
    emit(this, 'kt-cancel');
  }

  /** Escape closes the native dialog; report it as a cancel. */
  private onDialogClose(): void {
    if (this.open) this.cancel();
  }

  private onDialogClick(event: MouseEvent): void {
    if (isBackdropClick(this.dialog, event)) this.cancel();
  }

  override render(): TemplateResult {
    return html`<dialog
      part="dialog"
      role="alertdialog"
      aria-label=${this.heading}
      aria-describedby=${this.message ? 'kt-confirm-message' : nothing}
      @close=${this.onDialogClose}
      @click=${this.onDialogClick}
    >
      <h2>${this.heading}</h2>
      ${this.message ? html`<p id="kt-confirm-message">${this.message}</p>` : nothing}
      <slot></slot>

      <div part="actions" class="actions">
        <kt-button data-cancel variant="dark" @click=${this.cancel}>${this.cancelLabel}</kt-button>
        <kt-button
          variant=${this.variant === 'danger' ? 'delete' : 'primary'}
          @click=${this.confirm}
          >${this.confirmLabel}</kt-button
        >
      </div>
    </dialog>`;
  }
}

defineElement('kt-confirm-dialog', KtConfirmDialog);

declare global {
  interface HTMLElementTagNameMap {
    'kt-confirm-dialog': KtConfirmDialog;
  }
}
