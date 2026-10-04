import { css, html, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { KtElement, defineElement } from '#internal/kt-element';
import { emit, toggleListener, uniqueId } from '#internal/events';
import { FloatingController, floatingStyles } from '#internal/floating';
import '../../core/kt-avatar/kt-avatar.js';
import '../../core/kt-icon/kt-icon.js';

export interface KtUserMenuItem {
  readonly id: string;
  readonly label: string;
  /** A Lucide icon name, before the label. */
  readonly icon?: string;
  /** A rule above it, setting it apart from the items before. */
  readonly separator?: boolean;
  /** Drawn in the danger colour: sign out, delete the account. */
  readonly danger?: boolean;
  readonly disabled?: boolean;
}

/**
 * The account menu at the end of an application's header: the person's
 * avatar, and under it who is signed in and what they can do — their profile,
 * their settings, switching workspace, signing out.
 *
 * A menu button, as the WAI-ARIA pattern describes: Enter, Space or the down
 * arrow open it on the first item, the up arrow on the last; the arrows, Home
 * and End move between items; Escape closes it and gives the focus back; Tab
 * or a click outside close it too. The panel is drawn in the top layer, so no
 * overflow clips it.
 *
 * @element kt-user-menu
 *
 * @slot - Under the items: a workspace switcher, a theme toggle, a plan badge.
 *
 * @csspart trigger - The button.
 * @csspart panel - The menu's panel.
 * @csspart item - One item.
 *
 * @fires kt-select - An item was chosen. `detail: { id, item }`.
 * @fires kt-open - The menu opened.
 * @fires kt-close - The menu closed.
 *
 * @example
 * ```html
 * <kt-user-menu name="Dana Whitfield" email="dana@northwind.io"></kt-user-menu>
 * <script>
 *   menu.items = [
 *     { id: 'profile', label: 'Profile', icon: 'user' },
 *     { id: 'signout', label: 'Sign out', separator: true, danger: true },
 *   ];
 * </script>
 * ```
 */
export class KtUserMenu extends KtElement {
  static override styles = [
    KtElement.styles,
    floatingStyles,
    css`
      :host {
        display: inline-block;
      }

      .trigger {
        display: inline-flex;
        gap: var(--gap-button);
        align-items: center;
        padding: 2px;
        color: var(--text-body);
        font: var(--font-normal-medium);
        background: none;
        border: none;
        border-radius: var(--radius-full);
        cursor: pointer;
      }
      :host([show-name]) .trigger {
        padding-inline-end: 10px;
      }
      .trigger:hover {
        background: var(--surface-hover);
      }
      .trigger:focus-visible {
        outline: var(--outline-width) solid var(--color-primary-base);
        outline-offset: 2px;
      }

      .panel {
        box-sizing: border-box;
        width: 260px;
        padding: var(--padding-expand);
        background: var(--surface-popover);
        border-radius: var(--radius-input);
        opacity: 1;
        transform: none;
        transition:
          opacity var(--duration-fast) var(--easing-standard),
          transform var(--duration-fast) var(--easing-standard);
      }
      @starting-style {
        .panel {
          opacity: 0;
          transform: translateY(-6px);
        }
      }

      .who {
        display: flex;
        gap: var(--gap-form);
        align-items: center;
        padding: 8px 8px 12px;
      }
      .who-text {
        display: grid;
        min-width: 0;
      }
      .who-name {
        overflow: hidden;
        color: var(--text-body);
        font: var(--font-normal-medium);
        white-space: nowrap;
        text-overflow: ellipsis;
      }
      .who-email {
        overflow: hidden;
        color: var(--text-muted);
        font: var(--font-normal-small);
        white-space: nowrap;
        text-overflow: ellipsis;
      }

      [role='menu'] {
        display: grid;
        gap: 2px;
        margin: 0;
        padding: 4px 0 0;
        list-style: none;
        border-top: var(--border-width) solid var(--divider-popover);
      }
      [role='separator'] {
        height: var(--border-width);
        margin: 4px 0;
        background: var(--divider-popover);
      }
      .item {
        display: flex;
        gap: 10px;
        align-items: center;
        padding: 8px 10px;
        color: var(--text-body);
        font: var(--font-normal-regular);
        border-radius: var(--radius-input);
        outline: none;
        cursor: pointer;
      }
      .item kt-icon {
        color: var(--text-muted);
      }
      .item:hover,
      .item:focus-visible {
        background: var(--surface-hover);
      }
      .item:focus-visible {
        box-shadow: inset 0 0 0 var(--outline-width) var(--color-primary-base);
      }
      .item.danger,
      .item.danger kt-icon {
        color: var(--color-danger-text);
      }
      .item.disabled {
        color: var(--text-disabled);
        cursor: not-allowed;
      }

      .extra:empty {
        display: none;
      }

      @media (prefers-reduced-motion: reduce) {
        .panel {
          transition: none;
        }
      }
    `,
  ];

  /** The person signed in: names the button, draws the avatar's initials. */
  @property({ type: String })
  name = '';

  /** Under the name in the panel. */
  @property({ type: String })
  email = '';

  /** A picture for the avatar. */
  @property({ type: String })
  avatar = '';

  /** The menu's items. Set as a property: `menu.items = [...]`. */
  @property({ attribute: false })
  items: readonly KtUserMenuItem[] = [];

  /** Shows the name beside the avatar on the button. */
  @property({ type: Boolean, reflect: true, attribute: 'show-name' })
  showName = false;

  /** Whether the menu is open. */
  @state() open = false;

  @query('.trigger') private trigger!: HTMLButtonElement;

  private readonly menuId = uniqueId('kt-user-menu');
  private readonly floating = new FloatingController(this, {
    panel: () => this.shadowRoot?.querySelector<HTMLElement>('.panel'),
    anchor: () => this.trigger,
    align: () => 'end',
  });

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.listen(false);
  }

  private listen(on: boolean): void {
    toggleListener(on, document, 'pointerdown', this.onDocumentPointerDown);
  }

  private onDocumentPointerDown = (event: Event): void => {
    if (!event.composedPath().includes(this)) this.hide(false);
  };

  private get menuItems(): HTMLElement[] {
    return [
      ...(this.shadowRoot?.querySelectorAll<HTMLElement>(
        '[role="menuitem"]:not([aria-disabled])',
      ) ?? []),
    ];
  }

  /** Opens the menu, focusing its first item, or its last with `from: 'end'`. */
  show(from: 'start' | 'end' = 'start'): void {
    if (!this.open) {
      this.open = true;
      emit(this, 'kt-open');
    }
    void this.updateComplete.then(() => {
      const items = this.menuItems;
      (from === 'end' ? items.at(-1) : items[0])?.focus();
    });
  }

  /** Closes the menu; the focus goes back to the button unless told otherwise. */
  hide(refocus = true): void {
    if (!this.open) return;
    this.open = false;
    emit(this, 'kt-close');
    if (refocus) void this.updateComplete.then(() => this.trigger.focus());
  }

  // `open` is a state, so the map is read untyped.
  override updated(changed: PropertyValues): void {
    if (changed.has('open')) this.listen(this.open);
    this.floating.sync(this.open);
  }

  private choose(item: KtUserMenuItem): void {
    if (item.disabled) return;
    this.hide();
    emit(this, 'kt-select', { id: item.id, item });
  }

  private onTriggerKeyDown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.show(event.key === 'ArrowUp' ? 'end' : 'start');
    }
  }

  private onMenuKeyDown(event: KeyboardEvent): void {
    const items = this.menuItems;
    const index = items.indexOf(event.target as HTMLElement);
    const go = (to: number) => {
      event.preventDefault();
      items[(to + items.length) % items.length]?.focus();
    };
    switch (event.key) {
      case 'ArrowDown':
        go(index + 1);
        break;
      case 'ArrowUp':
        go(index - 1);
        break;
      case 'Home':
        go(0);
        break;
      case 'End':
        go(items.length - 1);
        break;
      case 'Escape':
        event.preventDefault();
        this.hide();
        break;
      case 'Tab':
        this.hide(false);
        break;
      case 'Enter':
      case ' ': {
        event.preventDefault();
        const item = this.items.find(
          (candidate) => candidate.id === (event.target as HTMLElement).dataset['id'],
        );
        if (item) this.choose(item);
        break;
      }
    }
  }

  private renderItem(item: KtUserMenuItem): TemplateResult {
    return html`${item.separator ? html`<li role="separator"></li>` : nothing}
      <li
        part="item"
        role="menuitem"
        tabindex="-1"
        data-id=${item.id}
        class=${classMap({ item: true, danger: Boolean(item.danger), disabled: Boolean(item.disabled) })}
        aria-disabled=${item.disabled ? 'true' : nothing}
        @click=${() => this.choose(item)}
      >
        ${item.icon ? html`<kt-icon name=${item.icon} size="16"></kt-icon>` : nothing}
        <span>${item.label}</span>
      </li>`;
  }

  override render(): TemplateResult {
    return html`<button
        part="trigger"
        class="trigger"
        type="button"
        aria-label=${this.name || nothing}
        aria-haspopup="menu"
        aria-expanded=${this.open ? 'true' : 'false'}
        aria-controls=${this.open ? this.menuId : nothing}
        @click=${() => (this.open ? this.hide() : this.show())}
        @keydown=${this.onTriggerKeyDown}
      >
        <kt-avatar name=${this.name} src=${this.avatar || nothing} size="small"></kt-avatar>
        ${this.showName ? html`<span aria-hidden="true">${this.name}</span>` : nothing}
      </button>
      ${
        this.open
          ? html`<div part="panel" class="panel floating" popover="manual">
              <div class="who">
                <kt-avatar name=${this.name} src=${this.avatar || nothing}></kt-avatar>
                <div class="who-text">
                  <span class="who-name">${this.name}</span>
                  ${this.email ? html`<span class="who-email">${this.email}</span>` : nothing}
                </div>
              </div>
              <ul
                role="menu"
                id=${this.menuId}
                aria-label=${this.name || nothing}
                @keydown=${this.onMenuKeyDown}
              >
                ${this.items.map((item) => this.renderItem(item))}
              </ul>
              <div class="extra"><slot></slot></div>
            </div>`
          : nothing
      }`;
  }
}

defineElement('kt-user-menu', KtUserMenu);

declare global {
  interface HTMLElementTagNameMap {
    'kt-user-menu': KtUserMenu;
  }
}
