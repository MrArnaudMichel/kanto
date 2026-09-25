import { css, html, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { property, queryAssignedElements } from 'lit/decorators.js';
import { KtElement, defineElement } from '#internal/kt-element';
import { emit } from '#internal/events';
import {
  attachFormInternals,
  setFormValue,
  setValidity,
  type UsableInternals,
} from '#internal/form-control';
import { strings } from '#internal/strings';

export type KtRadioGroupOrientation = 'vertical' | 'horizontal';

/**
 * One option of a `<kt-radio-group>`.
 *
 * It draws itself and carries `role="radio"`; the group owns the selection,
 * the tab stop and the keyboard. A `<kt-radio>` outside a group does nothing
 * useful.
 *
 * @element kt-radio
 *
 * @slot - The label.
 *
 * @csspart base - The `role="radio"` row.
 * @csspart circle - The drawn circle.
 */
export class KtRadio extends KtElement {
  static override styles = [
    KtElement.styles,
    css`
      :host {
        display: block;
        --radio-size: calc(var(--button-height) * 0.45);
      }

      .radio {
        display: inline-flex;
        align-items: flex-start;
        gap: var(--gap-button);
        color: var(--text-body);
        font: var(--font-normal-regular);
        outline: none;
        cursor: pointer;
      }

      .circle {
        position: relative;
        flex: none;
        width: var(--radio-size);
        height: var(--radio-size);
        margin-top: calc((1lh - var(--radio-size)) / 2);
        background-color: var(--surface-field);
        border: var(--border-width) solid var(--border-field);
        border-radius: var(--radius-full);
        transition: border-color var(--duration-instant);
      }

      /* The dot: a fill inset by a third of the circle. */
      .circle::after {
        content: '';
        position: absolute;
        inset: 22%;
        border-radius: var(--radius-full);
        background-color: var(--color-primary-base);
        transform: scale(0);
        transition: transform var(--duration-fast);
      }

      .radio:hover .circle {
        border-color: var(--text-muted);
      }

      .radio:focus-visible .circle {
        outline: var(--outline-width) solid var(--color-primary-base);
        outline-offset: 2px;
      }

      .radio[aria-checked='true'] .circle {
        border-color: var(--color-primary-base);
      }
      .radio[aria-checked='true'] .circle::after {
        transform: scale(1);
      }

      :host([invalid]) .circle {
        border-color: var(--color-danger-base);
      }

      :host([disabled]) .radio,
      :host([group-disabled]) .radio {
        color: var(--text-disabled);
        cursor: not-allowed;
      }
      :host([disabled]) .circle,
      :host([group-disabled]) .circle {
        background-color: var(--color-dark-22);
        border-color: var(--color-dark-24);
      }
      :host([disabled]) .circle::after,
      :host([group-disabled]) .circle::after {
        background-color: var(--text-disabled);
      }
    `,
  ];

  /** Submitted by the group when this option is chosen. */
  @property({ type: String, reflect: true })
  value = '';

  @property({ type: Boolean, reflect: true })
  disabled = false;

  /** Set by the group. */
  @property({ type: Boolean, reflect: true })
  checked = false;

  /** Set by the group: whether this option holds the group's one tab stop. */
  @property({ type: Boolean, attribute: false })
  tabbable = false;

  /** Set by the group while it reports an error. */
  @property({ type: Boolean, reflect: true })
  invalid = false;

  /** Set by the group while the whole group is disabled. */
  @property({ type: Boolean, reflect: true, attribute: 'group-disabled' })
  groupDisabled = false;

  private get inactive(): boolean {
    return this.disabled || this.groupDisabled;
  }

  override focus(options?: FocusOptions): void {
    this.shadowRoot?.querySelector<HTMLElement>('.radio')?.focus(options);
  }

  override render(): TemplateResult {
    return html`<div
      part="base"
      class="radio"
      role="radio"
      aria-checked=${this.checked ? 'true' : 'false'}
      aria-disabled=${this.inactive ? 'true' : nothing}
      tabindex=${this.tabbable && !this.inactive ? 0 : -1}
    >
      <span part="circle" class="circle"></span>
      <span class="text"><slot></slot></span>
    </div>`;
  }
}

/**
 * One choice among a few, all visible at once.
 *
 * Reach for it over `<kt-select>` when there are few enough options to show
 * them all — seeing every option is the point — and over
 * `<kt-segmented-control>` when the options need a sentence each, or the
 * choice belongs in a form rather than a toolbar.
 *
 * Native radios cannot form a group across shadow roots, so this is the ARIA
 * radio group pattern: one tab stop for the whole group, arrow keys move and
 * select, disabled options are skipped.
 *
 * @element kt-radio-group
 *
 * @slot - The `<kt-radio>` options.
 *
 * @csspart base - The `role="radiogroup"` container.
 *
 * @fires kt-change - An option was chosen. `detail: { value }`.
 *
 * @example
 * ```html
 * <kt-radio-group label="Billing" name="billing" value="monthly">
 *   <kt-radio value="monthly">Monthly</kt-radio>
 *   <kt-radio value="yearly">Yearly — two months free</kt-radio>
 * </kt-radio-group>
 * ```
 */
export class KtRadioGroup extends KtElement {
  static readonly formAssociated = true;

  static override styles = [
    KtElement.styles,
    css`
      :host {
        display: block;
      }

      .group {
        display: flex;
        flex-direction: column;
        gap: var(--gap-element);
      }

      :host([orientation='horizontal']) .group {
        flex-direction: row;
        flex-wrap: wrap;
        column-gap: var(--gap-card);
      }
    `,
  ];

  @queryAssignedElements({ selector: 'kt-radio' })
  private radios!: KtRadio[];

  private internals: UsableInternals | null = null;
  private defaultValue: string | null = null;

  /** The chosen option's value, or `null`. */
  @property({ type: String, reflect: true })
  value: string | null = null;

  @property({ type: String })
  name = '';

  /** Accessible name of the group. */
  @property({ type: String })
  label = '';

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  required = false;

  @property({ type: String, reflect: true })
  orientation: KtRadioGroupOrientation = 'vertical';

  /** Error message. A non-empty value puts the group in its error state. */
  @property({ type: String, reflect: true })
  error = '';

  override connectedCallback(): void {
    super.connectedCallback();
    this.internals ??= attachFormInternals(this);
    this.defaultValue = this.value;
    // On the host: the radios are slotted light-DOM children.
    this.addEventListener('click', this.onClick);
    this.addEventListener('keydown', this.onKeyDown);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('click', this.onClick);
    this.removeEventListener('keydown', this.onKeyDown);
  }

  override willUpdate(changed: PropertyValues<this>): void {
    if (
      changed.has('value') ||
      changed.has('required') ||
      changed.has('error') ||
      this.stringsChanged(changed)
    ) {
      setFormValue(this.internals, this.value);

      const missing = this.required && this.value === null;
      setValidity(
        this.internals,
        { valueMissing: missing, customError: Boolean(this.error) },
        this.error || (missing ? strings().selectOption : ''),
      );
    }
  }

  override updated(): void {
    this.syncRadios();
  }

  formResetCallback(): void {
    this.value = this.defaultValue;
  }

  formStateRestoreCallback(state: string | null): void {
    this.value = state;
  }

  override focus(options?: FocusOptions): void {
    this.radios.find((radio) => radio.tabbable)?.focus(options);
  }

  private enabled(): KtRadio[] {
    return this.disabled ? [] : this.radios.filter((radio) => !radio.disabled);
  }

  /**
   * Pushes the group's state down; the radios are the display, not the truth.
   * The tab stop sits on the chosen option, or the first enabled one.
   */
  private syncRadios = (): void => {
    const enabled = this.enabled();
    const chosen = enabled.find((radio) => radio.value === this.value);
    const tabStop = chosen ?? enabled[0];

    for (const radio of this.radios) {
      radio.checked = radio.value === this.value;
      radio.tabbable = radio === tabStop;
      radio.invalid = Boolean(this.error);
      radio.groupDisabled = this.disabled;
    }
  };

  private choose(radio: KtRadio): void {
    if (radio.value === this.value) return;
    this.value = radio.value;
    emit(this, 'kt-change', { value: this.value });
  }

  private onClick = (event: Event): void => {
    const radio = event.composedPath().find((node): node is KtRadio => node instanceof KtRadio);
    if (!radio || !this.enabled().includes(radio)) return;
    this.choose(radio);
    radio.focus();
  };

  /** Arrows move and select, wrapping; Space selects the focused option. */
  private onKeyDown = (event: KeyboardEvent): void => {
    const enabled = this.enabled();
    if (enabled.length === 0) return;

    const focused = event.composedPath().find((node): node is KtRadio => node instanceof KtRadio);
    const from = focused ? enabled.indexOf(focused) : -1;

    let target: KtRadio | undefined;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      target = enabled[(from + 1) % enabled.length];
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      target = enabled[(from - 1 + enabled.length) % enabled.length];
    } else if (event.key === ' ' && focused && from >= 0) {
      target = focused;
    } else {
      return;
    }

    event.preventDefault();
    if (!target) return;
    this.choose(target);
    void this.updateComplete.then(() => target.focus());
  };

  override render(): TemplateResult {
    return html`${
        this.error
          ? html`<span id="error-message" class="visually-hidden">${this.error}</span>`
          : nothing
      }
      <div
        part="base"
        class="group"
        role="radiogroup"
        aria-label=${this.label || strings().options}
        aria-orientation=${this.orientation}
        aria-required=${this.required ? 'true' : nothing}
        aria-invalid=${this.error ? 'true' : nothing}
        aria-disabled=${this.disabled ? 'true' : nothing}
        aria-describedby=${this.error ? 'error-message' : nothing}
      >
        <slot @slotchange=${this.syncRadios}></slot>
      </div>`;
  }
}

defineElement('kt-radio', KtRadio);
defineElement('kt-radio-group', KtRadioGroup);

declare global {
  interface HTMLElementTagNameMap {
    'kt-radio': KtRadio;
    'kt-radio-group': KtRadioGroup;
  }
}
