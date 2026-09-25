import { css, html, type PropertyValues, type TemplateResult } from 'lit';
import { property, queryAssignedElements } from 'lit/decorators.js';
import { KtElement, defineElement } from '#internal/kt-element';
import { emit } from '#internal/events';
import { strings } from '#internal/strings';
import { KtToggleButton } from '../kt-toggle-button/kt-toggle-button.js';

/**
 * Joins `<kt-toggle-button>`s into one segmented bar and coordinates their
 * selection.
 *
 * Single mode behaves like a radio group with a deselect: clicking the active
 * button clears it. Multiple mode is a set of independent checkboxes that
 * happen to be drawn together.
 *
 * The buttons are slotted rather than described by an options array, so a
 * button can hold whatever its label needs — an icon, a count, a badge.
 *
 * @element kt-toggle-button-group
 *
 * @slot - The `<kt-toggle-button>` children.
 *
 * @csspart base - The group container.
 *
 * @fires kt-change - The selection changed.
 *   `detail: { value }` — a single value or `null`, or an array in multiple mode.
 *
 * @example
 * ```html
 * <kt-toggle-button-group>
 *   <kt-toggle-button value="list" icon="list" label="List"></kt-toggle-button>
 *   <kt-toggle-button value="grid" icon="grid" label="Grid"></kt-toggle-button>
 * </kt-toggle-button-group>
 * ```
 */
export class KtToggleButtonGroup extends KtElement {
  static override styles = [
    KtElement.styles,
    css`
      :host {
        display: inline-flex;
        width: fit-content;
      }

      .group {
        display: inline-flex;
        gap: 0;
      }

      :host([orientation='vertical']) .group {
        flex-direction: column;
      }

      /* The buttons butt up against each other: square off the inner corners,
         pull them together by a border width, and lift the selected one so its
         border wins over its neighbour's. */
      ::slotted(kt-toggle-button) {
        position: relative;
        z-index: 1;
        --kt-toggle-button-radius: 0;
      }

      ::slotted(kt-toggle-button[selected]) {
        z-index: 3;
      }

      :host(:not([orientation='vertical'])) ::slotted(kt-toggle-button:not(:first-child)) {
        margin-left: calc(var(--border-width) * -1);
      }
      :host(:not([orientation='vertical'])) ::slotted(kt-toggle-button:first-child) {
        --kt-toggle-button-radius: var(--border-radius) 0 0 var(--border-radius);
      }
      :host(:not([orientation='vertical'])) ::slotted(kt-toggle-button:last-child) {
        --kt-toggle-button-radius: 0 var(--border-radius) var(--border-radius) 0;
      }

      :host([orientation='vertical']) ::slotted(kt-toggle-button:not(:first-child)) {
        margin-top: calc(var(--border-width) * -1);
      }
      :host([orientation='vertical']) ::slotted(kt-toggle-button:first-child) {
        --kt-toggle-button-radius: var(--border-radius) var(--border-radius) 0 0;
      }
      :host([orientation='vertical']) ::slotted(kt-toggle-button:last-child) {
        --kt-toggle-button-radius: 0 0 var(--border-radius) var(--border-radius);
      }

      /* A lone button keeps all four corners. */
      ::slotted(kt-toggle-button:only-child) {
        --kt-toggle-button-radius: var(--border-radius);
      }
    `,
  ];

  @queryAssignedElements({ selector: 'kt-toggle-button' })
  private buttons!: KtToggleButton[];

  /** `false`: one selection at a time. `true`: any number. */
  @property({ type: Boolean, reflect: true })
  multiple = false;

  @property({ type: String, reflect: true })
  orientation: 'horizontal' | 'vertical' = 'horizontal';

  /** Accessible name for the group. */
  @property({ type: String })
  label = '';

  /** The selected value, or values in multiple mode. */
  @property({ attribute: false })
  value: string | string[] | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    // Listen on the host: the buttons are slotted light-DOM children, so a
    // listener inside the shadow root would see them through a retargeted
    // event.
    this.addEventListener('click', this.onButtonClick);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('click', this.onButtonClick);
  }

  override firstUpdated(): void {
    this.syncButtons();
  }

  override updated(changed: PropertyValues<this>): void {
    if (changed.has('value') || changed.has('multiple')) this.syncButtons();
  }

  private isSelected(candidate: string): boolean {
    if (this.multiple) return Array.isArray(this.value) && this.value.includes(candidate);
    return this.value === candidate;
  }

  /** Pushes the group's state down; the buttons are the display, not the truth. */
  private syncButtons(): void {
    for (const button of this.buttons ?? []) {
      button.managed = true;
      button.selected = this.isSelected(button.value);
    }
  }

  private onButtonClick = (event: Event): void => {
    // composedPath rather than target: the click starts on the <button> inside
    // the child's shadow root, and reading target relies on retargeting, which
    // browsers do and test DOMs do not.
    const button = event
      .composedPath()
      .find((node): node is KtToggleButton => node instanceof KtToggleButton);

    if (!button || button.disabled) return;
    if (!this.buttons?.includes(button)) return;

    if (this.multiple) {
      const current = Array.isArray(this.value) ? this.value : [];
      this.value = current.includes(button.value)
        ? current.filter((candidate) => candidate !== button.value)
        : [...current, button.value];
    } else {
      this.value = this.value === button.value ? null : button.value;
    }

    this.syncButtons();
    emit(this, 'kt-change', { value: this.value });
  };

  override render(): TemplateResult {
    return html`<div
      part="base"
      class="group"
      role="group"
      aria-label=${this.label || strings().options}
    >
      <slot @slotchange=${this.syncButtons}></slot>
    </div>`;
  }
}

defineElement('kt-toggle-button-group', KtToggleButtonGroup);

declare global {
  interface HTMLElementTagNameMap {
    'kt-toggle-button-group': KtToggleButtonGroup;
  }
}
