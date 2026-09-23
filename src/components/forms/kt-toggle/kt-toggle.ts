import { css, html, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { KtElement, defineElement } from '#internal/kt-element';
import { emit } from '#internal/events';
import { attachFormInternals, setFormValue, type UsableInternals } from '#internal/form-control';

export type KtToggleSize = 'small' | 'medium' | 'large';

/**
 * An on/off switch.
 *
 * Sized off the button heights so a toggle lines up with the controls beside
 * it: the track is 1.8× the field height, the thumb is inset by 12% of it.
 * Change `--button-height` and the switch follows.
 *
 * @element kt-toggle
 *
 * @slot - Optional label, rendered beside the switch and clickable.
 *
 * @csspart base - The button carrying `role="switch"`.
 * @csspart track - The track.
 * @csspart thumb - The sliding thumb.
 *
 * @fires kt-change - The state changed. `detail: { checked }`.
 *
 * @example
 * ```html
 * <kt-toggle checked>Notifications</kt-toggle>
 * <kt-toggle size="small" disabled></kt-toggle>
 * ```
 */
export class KtToggle extends KtElement {
  static readonly formAssociated = true;

  static override styles = [
    KtElement.styles,
    css`
      :host {
        display: inline-flex;
        align-items: center;
        gap: var(--gap-button);

        /* The whole switch derives from the field height, so it keeps its
           proportions at every breakpoint and every size. */
        --switch-height: var(--button-height);
        --switch-inset: calc(var(--switch-height) * 0.12);
        --thumb-size: calc(var(--switch-height) - var(--switch-inset) * 2);
      }

      :host([size='small']) {
        --switch-height: var(--button-height-small);
      }
      :host([size='large']) {
        --switch-height: var(--button-height-large);
      }

      button {
        display: inline-flex;
        margin: 0;
        padding: 0;
        background: transparent;
        border: none;
        outline: none;
        appearance: none;
        cursor: pointer;
      }

      button:disabled {
        cursor: not-allowed;
      }

      button:focus-visible .track {
        outline: var(--outline-width) solid var(--color-primary-base);
        outline-offset: 2px;
      }

      .track {
        position: relative;
        display: inline-block;
        width: calc(var(--switch-height) * 1.8);
        height: var(--switch-height);
        background-color: var(--color-dark-24);
        border-radius: var(--radius-full);
        transition: background-color var(--duration-instant);
      }

      button[aria-checked='true'] .track {
        background-color: var(--color-primary-base);
      }

      .thumb {
        position: absolute;
        top: var(--switch-inset);
        left: var(--switch-inset);
        width: var(--thumb-size);
        height: var(--thumb-size);
        background-color: var(--color-white);
        border-radius: var(--radius-full);
        transition: left var(--duration-normal);
      }

      button[aria-checked='true'] .thumb {
        left: calc(100% - var(--switch-inset) - var(--thumb-size));
      }

      :host([disabled]) .track {
        background-color: var(--color-dark-22);
      }
      :host([disabled]) .thumb {
        background-color: var(--color-text-500);
      }

      .label {
        color: var(--text-body);
        font: var(--font-normal-regular);
        cursor: pointer;
      }

      :host([disabled]) .label {
        color: var(--text-disabled);
        cursor: not-allowed;
      }
    `,
  ];

  private internals: UsableInternals | null = null;
  private defaultChecked = false;

  @property({ type: Boolean, reflect: true })
  checked = false;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: String, reflect: true })
  size: KtToggleSize = 'medium';

  @property({ type: String })
  name = '';

  /** Submitted when checked, as for a native checkbox. */
  @property({ type: String })
  value = 'on';

  /** Accessible name, when nothing is slotted. */
  @property({ type: String })
  label = '';

  override connectedCallback(): void {
    super.connectedCallback();
    this.internals ??= attachFormInternals(this);
    this.defaultChecked = this.checked;
    this.syncFormValue();
  }

  override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has('checked') || changed.has('value')) this.syncFormValue();
  }

  private syncFormValue(): void {
    // An unchecked checkbox contributes nothing to a submission, not an empty
    // string — null is how ElementInternals says "leave me out".
    setFormValue(this.internals, this.checked ? this.value : null);
  }

  formResetCallback(): void {
    this.checked = this.defaultChecked;
  }

  formStateRestoreCallback(state: string): void {
    this.checked = state === this.value;
  }

  override focus(options?: FocusOptions): void {
    this.shadowRoot?.querySelector('button')?.focus(options);
  }

  private toggle(): void {
    if (this.disabled) return;
    this.checked = !this.checked;
    emit(this, 'kt-change', { checked: this.checked });
  }

  override render(): TemplateResult {
    return html`<button
        part="base"
        type="button"
        role="switch"
        aria-checked=${this.checked ? 'true' : 'false'}
        aria-label=${this.label || nothing}
        aria-labelledby=${this.label ? nothing : 'label'}
        ?disabled=${this.disabled}
        @click=${this.toggle}
      >
        <span part="track" class="track">
          <span part="thumb" class="thumb"></span>
        </span>
      </button>
      <span id="label" class="label" @click=${this.toggle}><slot></slot></span>`;
  }
}

defineElement('kt-toggle', KtToggle);

declare global {
  interface HTMLElementTagNameMap {
    'kt-toggle': KtToggle;
  }
}
