import { css, html, type TemplateResult } from 'lit';
import { property, query } from 'lit/decorators.js';
import { KtElement, defineElement } from 'kanto-ds/internal/kt-element';

/** Anything that can take an accessible name from the label. */
interface Labelable extends HTMLElement {
  label?: string;
  focus(): void;
}

/**
 * A label above a form control, with a red asterisk when it is required.
 *
 * Native label association does not cross a shadow boundary — `for` and
 * implicit wrapping both need the label and the control in the same tree — so
 * this element passes its text down to the slotted control's `label` property
 * instead, which becomes the control's `aria-label`. Clicking the label still
 * focuses the control, as it would natively.
 *
 * @element kt-label-input
 *
 * @slot - The form control to label.
 *
 * @csspart label - The `<label>`.
 *
 * @example
 * ```html
 * <kt-label-input label="Adresse e-mail" required>
 *   <kt-input name="email" type="email" required></kt-input>
 * </kt-label-input>
 * ```
 */
export class KtLabelInput extends KtElement {
  static override styles = [
    KtElement.styles,
    css`
      :host {
        display: flex;
        flex-direction: column;
        gap: var(--gap-button);
      }

      label {
        color: var(--text-body);
        font: var(--font-normal-medium);
        cursor: default;
      }

      .required {
        margin-left: 2px;
        color: var(--color-danger-base);
      }
    `,
  ];

  @query('slot')
  private defaultSlot!: HTMLSlotElement;

  /** The label text. */
  @property({ type: String })
  label = '';

  /** Appends a red asterisk and marks the control required for screen readers. */
  @property({ type: Boolean, reflect: true })
  required = false;

  private get control(): Labelable | undefined {
    return this.defaultSlot
      ?.assignedElements({ flatten: true })
      .find((element): element is Labelable => element instanceof HTMLElement);
  }

  private labelControl(): void {
    const control = this.control;
    if (!control) return;

    if ('label' in control) control.label = this.label;
    else control.setAttribute('aria-label', this.label);
  }

  override updated(): void {
    this.labelControl();
  }

  private focusControl(): void {
    this.control?.focus();
  }

  override render(): TemplateResult {
    return html`<label part="label" @click=${this.focusControl}>
        ${this.label}${
          this.required ? html`<span class="required" aria-hidden="true">*</span>` : ''
        }
      </label>
      <slot @slotchange=${this.labelControl}></slot>`;
  }
}

defineElement('kt-label-input', KtLabelInput);

declare global {
  interface HTMLElementTagNameMap {
    'kt-label-input': KtLabelInput;
  }
}
