import { css, html, nothing, type TemplateResult } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { KtElement, defineElement } from '../../internal/kt-element.js';
import { emit } from '../../internal/events.js';
import { optionLabel, type KtOption } from '../../internal/listbox.js';

export type KtDropdownPlacement = 'bottom' | 'top';

/** Panel height plus the 6px offset, used to decide whether it fits below. */
const PANEL_SPACE = 224 + 6;

/**
 * A panel anchored to a trigger.
 *
 * The generic overlay: pass `options` for a menu, or slot anything into
 * `panel` for arbitrary content. For choosing a value in a form, reach for
 * `<kt-select>` or `<kt-input-menu>` instead — they carry the listbox
 * semantics this one deliberately does not assume.
 *
 * @element kt-dropdown
 *
 * @slot trigger - What opens the panel.
 * @slot panel - Panel contents, when `options` is not used.
 *
 * @csspart trigger - The trigger wrapper.
 * @csspart panel - The floating panel.
 * @csspart option - A menu row.
 *
 * @fires kt-select - A menu row was chosen. `detail: { value, option }`.
 * @fires kt-open - The panel opened.
 * @fires kt-close - The panel closed.
 */
export class KtDropdown extends KtElement {
  static override styles = [
    KtElement.styles,
    css`
      :host {
        position: relative;
        display: inline-block;
      }

      .trigger {
        border-radius: var(--radius-input);
        cursor: pointer;
      }

      :host([disabled]) .trigger {
        cursor: not-allowed;
        opacity: 0.6;
      }

      .panel {
        position: absolute;
        top: calc(100% + 6px);
        left: 0;
        z-index: var(--z-dropdown);
        box-sizing: border-box;
        width: 224px;
        max-height: 224px;
        margin: 0;
        padding: var(--padding-expand);
        background: var(--surface-raised);
        border-radius: var(--radius-input);
        transform: translateY(-6px);
        transform-origin: top left;
        visibility: hidden;
        opacity: 0;
        transition:
          opacity var(--duration-normal) var(--easing-standard),
          transform var(--duration-normal) var(--easing-standard);
      }

      .panel.top {
        top: auto;
        bottom: calc(100% + 6px);
        transform: translateY(6px);
        transform-origin: bottom left;
      }

      .panel.open {
        visibility: visible;
        opacity: 1;
        transform: translateY(0);
      }

      .list {
        display: flex;
        flex-direction: column;
        gap: var(--gap-element);
        max-height: 208px;
        margin: 0;
        padding: 0;
        overflow: auto;
        list-style: none;
        scrollbar-width: thin;
      }

      .option {
        padding: var(--padding-expand-item);
        color: var(--text-muted);
        font: var(--font-normal-regular);
        border-radius: var(--radius-input);
        cursor: pointer;
      }
      .option:hover {
        background: var(--surface-hover);
      }

      .option.selected {
        color: var(--text-body);
        font-weight: 600;
        background: var(--color-dark-23);
      }

      .option.disabled {
        opacity: 0.5;
        pointer-events: none;
      }

      .empty {
        padding: var(--padding-expand-item);
        color: var(--text-muted);
        font: var(--font-normal-small);
        cursor: default;
      }
    `,
  ];

  @query('.trigger')
  private triggerWrapper!: HTMLElement;

  @state()
  private open = false;

  /** Where the panel actually landed, after checking the room available. */
  @state()
  private placement: KtDropdownPlacement = 'bottom';

  /** Menu rows. Leave empty and slot into `panel` for custom content. */
  @property({ attribute: false })
  options: readonly KtOption[] = [];

  /** Marks one row as current. */
  @property({ type: String })
  value: string | number | null = null;

  /** Where to put the panel when there is room on both sides. */
  @property({ type: String, attribute: 'preferred-placement' })
  preferredPlacement: KtDropdownPlacement = 'bottom';

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: String, attribute: 'empty-text' })
  emptyText = 'Aucun résultat';

  /** Whether the panel is showing. */
  get isOpen(): boolean {
    return this.open;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener('pointerdown', this.onDocumentPointerDown);
    document.addEventListener('keydown', this.onDocumentKeyDown);
    window.addEventListener('resize', this.reposition);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('pointerdown', this.onDocumentPointerDown);
    document.removeEventListener('keydown', this.onDocumentKeyDown);
    window.removeEventListener('resize', this.reposition);
  }

  /**
   * Flips the panel above the trigger when there is not enough room below,
   * preferring whichever side has more space if neither fits.
   */
  private reposition = (): void => {
    const anchor = this.triggerWrapper ?? this;
    const rect = anchor.getBoundingClientRect();
    const below = window.innerHeight - rect.bottom;
    const above = rect.top;

    this.placement =
      this.preferredPlacement === 'top'
        ? above >= PANEL_SPACE || above >= below
          ? 'top'
          : 'bottom'
        : below >= PANEL_SPACE || below >= above
          ? 'bottom'
          : 'top';
  };

  private onDocumentPointerDown = (event: Event): void => {
    if (event.composedPath().includes(this)) return;
    this.hide();
  };

  private onDocumentKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') this.hide();
  };

  /** Opens the panel. */
  show(): void {
    if (this.disabled || this.open) return;
    this.reposition();
    this.open = true;
    emit(this, 'kt-open');
  }

  /** Closes the panel. */
  hide(): void {
    if (!this.open) return;
    this.open = false;
    emit(this, 'kt-close');
  }

  /** Opens or closes it. */
  toggle(): void {
    if (this.open) this.hide();
    else this.show();
  }

  private choose(option: KtOption): void {
    if (option.disabled) return;
    this.value = option.id;
    this.hide();
    emit(this, 'kt-select', { value: option.id, option });
  }

  override render(): TemplateResult {
    return html`<div
        part="trigger"
        class="trigger"
        aria-haspopup="menu"
        aria-expanded=${this.open ? 'true' : 'false'}
        @click=${this.toggle}
      >
        <slot name="trigger"></slot>
      </div>

      <div
        part="panel"
        class=${classMap({ panel: true, open: this.open, top: this.placement === 'top' })}
        role=${this.options.length > 0 ? 'menu' : 'group'}
        aria-hidden=${this.open ? 'false' : 'true'}
      >
        ${
          this.options.length > 0
            ? html`<ul class="list">
                ${this.options.map(
                  (option) =>
                    html`<li
                      part="option"
                      class=${classMap({
                        option: true,
                        selected: option.id === this.value,
                        disabled: Boolean(option.disabled),
                      })}
                      role="menuitem"
                      aria-disabled=${option.disabled ? 'true' : nothing}
                      @click=${() => this.choose(option)}
                    >
                      ${optionLabel(option)}
                    </li>`,
                )}
              </ul>`
            : html`<slot name="panel">
                <div class="empty">${this.emptyText}</div>
              </slot>`
        }
      </div>`;
  }
}

defineElement('kt-dropdown', KtDropdown);

declare global {
  interface HTMLElementTagNameMap {
    'kt-dropdown': KtDropdown;
  }
}
