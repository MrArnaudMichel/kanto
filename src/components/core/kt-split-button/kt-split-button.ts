import { css, html, nothing, type TemplateResult } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { KtElement, defineElement } from '#internal/kt-element';
import { emit } from '#internal/events';
import {
  firstEnabledIndex,
  lastEnabledIndex,
  nextEnabledIndex,
  optionLabel,
  type KtOption,
} from '#internal/listbox';
import { strings } from '#internal/strings';
import type { KtButtonSize, KtButtonVariant } from '../kt-button/kt-button.js';
import type { KtDropdown, KtDropdownPlacement } from '../../overlays/kt-dropdown/kt-dropdown.js';
import '../kt-button/kt-button.js';
import '../kt-icon/kt-icon.js';
import '../../overlays/kt-dropdown/kt-dropdown.js';

/** A row of the menu. `danger` tints it, for the one action to think twice about. */
export interface KtSplitButtonItem extends KtOption {
  readonly icon?: string;
  readonly variant?: 'default' | 'danger';
}

/** Icon size per button size, matching `<kt-button>`. */
const ICON_SIZE: Record<KtButtonSize, number> = { small: 16, medium: 20, large: 24 };

/**
 * One button carrying a menu of related actions.
 *
 * The body runs the action a user wants nine times out of ten and emits a
 * plain `click`; the caret opens the rest. Reach for it when the alternatives
 * are variations on the same action — "Save and close", "Save a copy" — and
 * for an unrelated set of actions use `<kt-dropdown>` instead, which has no
 * default action to promote.
 *
 * A caret press never reads as a `click` on the host, so a single `click`
 * listener means the primary action and nothing else.
 *
 * @element kt-split-button
 *
 * @slot - The primary action's label.
 *
 * @csspart action - The primary `<kt-button>`.
 * @csspart caret - The `<kt-button>` that opens the menu.
 * @csspart menu - The list of rows.
 * @csspart item - A menu row.
 *
 * @fires kt-select - A menu row was chosen. `detail: { value, item }`.
 * @fires kt-open - The menu opened.
 * @fires kt-close - The menu closed.
 *
 * @example
 * ```html
 * <kt-split-button>Save</kt-split-button>
 * ```
 * ```js
 * el.items = [
 *   { id: 'close', label: 'Save and close' },
 *   { id: 'discard', label: 'Discard', variant: 'danger' },
 * ];
 * el.addEventListener('kt-select', (e) => run(e.detail.value));
 * ```
 */
export class KtSplitButton extends KtElement {
  static override styles = [
    KtElement.styles,
    css`
      :host {
        display: inline-flex;
        vertical-align: middle;
      }

      /* A hairline of the page showing through is the seam between the two
         segments — the same trick the rest of the system uses for elevation,
         where a border would have been. */
      .split {
        display: inline-flex;
        align-items: stretch;
        gap: var(--border-width);
      }

      .action::part(button) {
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;
      }

      .caret::part(button) {
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
      }

      .menu {
        display: flex;
        flex-direction: column;
        gap: var(--gap-element);
        max-height: 208px;
        overflow: auto;
        scrollbar-width: thin;
      }

      .item {
        display: flex;
        align-items: center;
        gap: var(--gap-button);
        width: 100%;
        padding: var(--padding-expand-item);
        color: var(--text-muted);
        font: var(--font-normal-regular);
        text-align: left;
        background: none;
        border: none;
        border-radius: var(--radius-input);
        cursor: pointer;
      }

      .item:hover {
        color: var(--text-body);
        background: var(--surface-hover);
      }

      /* Inset, so the ring is never clipped by the panel it scrolls inside. */
      .item:focus-visible {
        outline: var(--outline-width) solid var(--color-primary-base);
        outline-offset: calc(-1 * var(--outline-width));
      }

      .item.danger {
        color: var(--color-danger-text);
      }
      .item.danger:hover {
        color: var(--color-danger-text);
        background: var(--color-danger-soft);
      }

      .item[aria-disabled='true'] {
        color: var(--text-disabled);
        cursor: not-allowed;
      }
      .item[aria-disabled='true']:hover {
        color: var(--text-disabled);
        background: none;
      }

      .empty {
        padding: var(--padding-expand-item);
        color: var(--text-muted);
        font: var(--font-normal-small);
        cursor: default;
      }
    `,
  ];

  @query('kt-dropdown')
  private dropdown?: KtDropdown;

  @query('.caret')
  private caret?: HTMLElement & { focus(): void };

  /** The row the roving tabindex currently sits on. */
  @state()
  private activeIndex = -1;

  /** The menu rows. */
  @property({ attribute: false })
  items: readonly KtSplitButtonItem[] = [];

  /** Visual variant, forwarded to both segments. */
  @property({ type: String, reflect: true })
  variant: KtButtonVariant = 'primary';

  /** Height, forwarded to both segments. */
  @property({ type: String, reflect: true })
  size: KtButtonSize = 'medium';

  @property({ type: Boolean, reflect: true })
  disabled = false;

  /** Lucide icon name for the primary segment. */
  @property({ type: String })
  icon = '';

  /** Accessible name of the caret, which has no text of its own. */
  @property({ type: String, attribute: 'menu-label' })
  menuLabel: string | undefined = undefined;

  /** Where to put the menu when there is room on both sides. */
  @property({ type: String, attribute: 'preferred-placement' })
  preferredPlacement: KtDropdownPlacement = 'bottom';

  @property({ type: String, attribute: 'empty-text' })
  emptyText: string | undefined = undefined;

  /** Whether the menu is showing. */
  get isOpen(): boolean {
    return this.dropdown?.isOpen ?? false;
  }

  /** Opens the menu. */
  show(): void {
    this.dropdown?.show();
  }

  /** Closes it. */
  hide(): void {
    this.dropdown?.hide();
  }

  /** Either. */
  toggle(): void {
    this.dropdown?.toggle();
  }

  /** Moves focus to the primary segment. */
  override focus(options?: FocusOptions): void {
    this.shadowRoot?.querySelector<HTMLElement>('.action')?.focus(options);
  }

  private row(index: number): HTMLElement | null {
    return this.shadowRoot?.querySelectorAll<HTMLElement>('.item')[index] ?? null;
  }

  /** Lands the roving tabindex on `index` and takes focus there. */
  private async moveTo(index: number): Promise<void> {
    if (index < 0) return;
    this.activeIndex = index;
    await this.updateComplete;
    this.row(index)?.focus();
  }

  private onOpen = (): void => {
    void this.moveTo(firstEnabledIndex(this.items));
  };

  /**
   * Returns focus to the caret, but only when it was inside the menu — an
   * outside click already moved it somewhere the user chose, and pulling it
   * back here would undo that.
   */
  private onClose = (): void => {
    const active = this.shadowRoot?.activeElement;
    this.activeIndex = -1;
    if (active instanceof HTMLElement && active.classList.contains('item')) this.caret?.focus();
  };

  private onMenuKeyDown = (event: KeyboardEvent): void => {
    const moves: Record<string, () => number> = {
      ArrowDown: () => nextEnabledIndex(this.items, this.activeIndex, 1),
      ArrowUp: () => nextEnabledIndex(this.items, this.activeIndex, -1),
      Home: () => firstEnabledIndex(this.items),
      End: () => lastEnabledIndex(this.items),
    };

    const move = moves[event.key];
    if (!move) return;

    event.preventDefault();
    void this.moveTo(move());
  };

  private choose(item: KtSplitButtonItem): void {
    if (item.disabled) return;
    this.hide();
    emit(this, 'kt-select', { value: item.id, item });
  }

  /**
   * A click anywhere in the menu stops here. It originates inside this
   * element's shadow root, so without this it would surface on the host as a
   * `click` and be mistaken for the primary action.
   */
  private containClick(event: Event): void {
    event.stopPropagation();
  }

  /**
   * The caret drives the panel itself rather than leaning on the click
   * reaching `<kt-dropdown>`'s own trigger through the slot: stopping here
   * keeps the press off the host, and leaving it to bubble would toggle twice.
   */
  private onCaretClick(event: Event): void {
    event.stopPropagation();
    this.toggle();
  }

  private renderItem(item: KtSplitButtonItem, index: number): TemplateResult {
    return html`<button
      part="item"
      class=${classMap({ item: true, danger: item.variant === 'danger' })}
      type="button"
      role="menuitem"
      tabindex=${index === this.activeIndex ? 0 : -1}
      aria-disabled=${item.disabled ? 'true' : nothing}
      @click=${() => this.choose(item)}
    >
      ${
        item.icon
          ? html`<kt-icon name=${item.icon} size=${ICON_SIZE[this.size]}></kt-icon>`
          : nothing
      }
      ${optionLabel(item)}
    </button>`;
  }

  override render(): TemplateResult {
    return html`<div class="split">
      <!-- The icon is slotted rather than passed as \`icon\`: <kt-button> reads
           its own text content to decide whether it is icon-only, and a <slot>
           has none, so setting \`icon\` here would collapse it to a square. -->
      <kt-button
        part="action"
        class="action"
        variant=${this.variant}
        size=${this.size}
        ?disabled=${this.disabled}
      >
        ${
          this.icon
            ? html`<kt-icon name=${this.icon} size=${ICON_SIZE[this.size]}></kt-icon>`
            : nothing
        }
        <slot></slot>
      </kt-button>

      <kt-dropdown
        align="end"
        preferred-placement=${this.preferredPlacement}
        ?disabled=${this.disabled}
        @click=${this.containClick}
        @kt-open=${this.onOpen}
        @kt-close=${this.onClose}
      >
        <kt-button
          slot="trigger"
          part="caret"
          class="caret"
          variant=${this.variant}
          size=${this.size}
          icon="chevron-down"
          label=${this.menuLabel ?? strings().moreActions}
          ?disabled=${this.disabled}
          @click=${this.onCaretClick}
        ></kt-button>

        <div slot="panel" part="menu" class="menu" role="menu" @keydown=${this.onMenuKeyDown}>
          ${
            this.items.length > 0
              ? this.items.map((item, index) => this.renderItem(item, index))
              : html`<div class="empty">${this.emptyText ?? strings().noActions}</div>`
          }
        </div>
      </kt-dropdown>
    </div>`;
  }
}

defineElement('kt-split-button', KtSplitButton);

declare global {
  interface HTMLElementTagNameMap {
    'kt-split-button': KtSplitButton;
  }
}
