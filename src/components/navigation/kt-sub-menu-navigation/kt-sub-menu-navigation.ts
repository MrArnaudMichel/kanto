import { css, html, nothing, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import { KtElement, defineElement } from '../../../internal/kt-element.js';
import { emit } from '../../../internal/events.js';
import '../../core/kt-icon/kt-icon.js';
import '../../core/kt-badge/kt-badge.js';

export interface KtNavItem {
  readonly label: string;
  readonly href?: string;
  /** Lucide icon name. Conventionally only the top level carries one. */
  readonly icon?: string;
  /** A count or a short status, right-aligned. */
  readonly badge?: string;
  readonly active?: boolean;
  readonly disabled?: boolean;
  /** Nested items. Any depth: a branch is drawn exactly like the level above. */
  readonly children?: readonly KtNavItem[];
  /** Open on first render. A branch holding the active item opens regardless. */
  readonly open?: boolean;
}

export interface KtNavSection {
  readonly title?: string;
  readonly items: readonly KtNavItem[];
}

/**
 * The sidebar navigation: uppercase overline section titles over lists of
 * links, to any depth.
 *
 * The recursion is the point. Every product grows a third level eventually —
 * Settings holds Members holds Roles — and the usual answer is to hand-roll
 * that one branch beside the component, which is how two navigation styles end
 * up on one screen. Here a branch renders exactly like the level above it,
 * indented by depth, and a branch containing the current page opens itself.
 *
 * @element kt-sub-menu-navigation
 *
 * @csspart nav - The `<nav>`.
 * @csspart section - A section.
 * @csspart title - A section title.
 * @csspart item - A navigation link or branch button, at any depth.
 *
 * @fires kt-navigate - A link was activated. `detail: { item }`. Cancel it to
 *   keep the browser from following the href, for client-side routing.
 * @fires kt-toggle - A branch opened or closed. `detail: { item, open }`.
 *
 * @example
 * ```js
 * nav.sections = [
 *   {
 *     title: 'Workspace',
 *     items: [
 *       { label: 'Home', href: '#/home', icon: 'house' },
 *       { label: 'Inbox', href: '#/inbox', icon: 'inbox', badge: '4' },
 *       {
 *         label: 'Settings',
 *         icon: 'settings',
 *         children: [
 *           { label: 'General', href: '#/settings/general' },
 *           { label: 'Members', href: '#/settings/members',
 *             children: [{ label: 'Roles', href: '#/settings/members/roles' }] },
 *         ],
 *       },
 *     ],
 *   },
 * ];
 * nav.activeHref = '#/settings/members/roles';
 * ```
 */
export class KtSubMenuNavigation extends KtElement {
  static override styles = [
    KtElement.styles,
    css`
      :host {
        display: block;
      }

      nav {
        display: flex;
        flex-direction: column;
        gap: var(--gap-sub-menu);
        padding: var(--padding-card);
        background-color: var(--surface-card);
        border-radius: var(--radius-sub-menu);
      }

      /* A full-height sidebar owns its own background; the card chrome would
         be a panel inside a panel. */
      :host([flush]) nav {
        gap: 20px;
        padding: 0;
        background: none;
        border-radius: 0;
      }

      .title {
        margin: 0;
        padding: 0 var(--nav-inset, 0) 6px;
        color: var(--color-text-500);
        font: var(--font-title-overline);
        letter-spacing: var(--letter-spacing-overline);
        text-transform: uppercase;
      }

      ul {
        display: flex;
        flex-direction: column;
        gap: var(--gap-element);
        margin: 0;
        padding: 0;
        list-style: none;
      }

      /* width: 100% matters on the branch rows: a <button> sizes to its content
         even as a flex container, so a branch's hover and active fill stopped
         at the end of its label while a link's ran the full row. */
      .item {
        position: relative;
        display: flex;
        box-sizing: border-box;
        align-items: center;
        width: 100%;
        gap: 10px;
        padding: var(--padding-sub-menu-item);
        padding-left: calc(var(--nav-pad-left, 16px) + var(--depth, 0) * 20px);
        color: var(--text-muted);
        font: var(--font-normal-regular);
        text-align: left;
        text-decoration: none;
        background: none;
        border: none;
        border-radius: var(--radius-input);
        cursor: pointer;
      }

      .item:hover {
        color: var(--text-body);
        background-color: var(--surface-hover);
        text-decoration: none;
      }

      .item:focus-visible {
        outline: var(--outline-width) solid var(--color-primary-base);
        outline-offset: -2px;
      }

      .item[aria-disabled='true'] {
        color: var(--text-disabled);
        pointer-events: none;
      }

      .active {
        color: var(--color-primary-base);
        background-color: var(--color-primary-soft);
      }

      .active:hover {
        color: var(--color-primary-base);
        background-color: var(--color-primary-soft);
      }

      /* The accent bar marks the current page without relying on the tint
         alone, which is the part that survives a forced-colors mode. */
      .active::before {
        position: absolute;
        top: 50%;
        left: 0;
        width: 3px;
        height: 18px;
        background: var(--color-primary-base);
        border-radius: 0 var(--radius-full) var(--radius-full) 0;
        transform: translateY(-50%);
        content: '';
      }

      /* A branch is highlighted, not marked current: the page is below it. */
      .within {
        color: var(--text-body);
      }

      .label {
        flex: 1;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }

      .chevron {
        flex: none;
        color: var(--color-text-500);
        transition: transform var(--duration-fast) var(--ease-standard);
      }

      .chevron.open {
        transform: rotate(90deg);
      }

      kt-icon {
        flex: none;
      }

      /* Collapsed: icons only. Hidden rather than clipped — a label sliced in
         half at 48px reads as a bug, not as a narrow sidebar. */
      :host([collapsed]) .title,
      :host([collapsed]) .label,
      :host([collapsed]) .chevron,
      :host([collapsed]) kt-badge,
      :host([collapsed]) .children {
        display: none;
      }

      :host([collapsed]) .item {
        justify-content: center;
        padding-right: 0;
        padding-left: 0;
      }
    `,
  ];

  @property({ attribute: false })
  sections: readonly KtNavSection[] = [];

  /** The href of the current page. Marks the matching link active. */
  @property({ type: String, attribute: 'active-href' })
  activeHref = '';

  @property({ type: String })
  label = 'Secondary navigation';

  /** Drops the card background, for a sidebar that owns its own surface. */
  @property({ type: Boolean, reflect: true })
  flush = false;

  /** Icons only. Labels, badges and branches are hidden rather than clipped. */
  @property({ type: Boolean, reflect: true })
  collapsed = false;

  /** Branch paths the reader has opened or closed, overriding the default. */
  @state()
  private overrides: Record<string, boolean> = {};

  private isActive(item: KtNavItem): boolean {
    return item.active === true || (this.activeHref !== '' && item.href === this.activeHref);
  }

  /** True when this item, or anything under it, is the current page. */
  private holdsActive(item: KtNavItem): boolean {
    if (this.isActive(item)) return true;
    return (item.children ?? []).some((child) => this.holdsActive(child));
  }

  private isOpen(item: KtNavItem, path: string): boolean {
    // A branch holding the current page opens regardless of what was clicked:
    // navigating to a page that is not visible is worse than losing a fold.
    if (this.holdsActive(item)) return true;
    return this.overrides[path] ?? item.open === true;
  }

  private onSelect(event: MouseEvent, item: KtNavItem): void {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;

    const proceed = emit(this, 'kt-navigate', { item });
    if (proceed.defaultPrevented) event.preventDefault();
  }

  private onToggle(item: KtNavItem, path: string): void {
    const open = !this.isOpen(item, path);
    this.overrides = { ...this.overrides, [path]: open };
    emit(this, 'kt-toggle', { item, open });
  }

  /** Opens every branch down to `activeHref`. Called on the section list. */
  private renderItems(items: readonly KtNavItem[], depth: number, prefix: string): TemplateResult {
    return html`<ul>
      ${items.map((item, index) => this.renderItem(item, depth, `${prefix}.${index}`))}
    </ul>`;
  }

  private renderItem(item: KtNavItem, depth: number, path: string): TemplateResult {
    const branch = (item.children ?? []).length > 0;
    const active = this.isActive(item);
    const open = branch && this.isOpen(item, path);
    const classes = classMap({
      item: true,
      active,
      within: branch && !active && this.holdsActive(item),
    });
    const inset = styleMap({ '--depth': String(depth) });

    const body = html`
      ${item.icon ? html`<kt-icon name=${item.icon} size="16"></kt-icon>` : nothing}
      <span class="label">${item.label}</span>
      ${item.badge ? html`<kt-badge variant="count">${item.badge}</kt-badge>` : nothing}
      ${
        branch
          ? html`<kt-icon
              class=${classMap({ chevron: true, open })}
              name="chevron-right"
              size="14"
            ></kt-icon>`
          : nothing
      }
    `;

    return html`<li>
      ${
        branch
          ? html`<button
              part="item"
              type="button"
              class=${classes}
              style=${inset}
              aria-expanded=${open ? 'true' : 'false'}
              aria-disabled=${item.disabled ? 'true' : nothing}
              @click=${() => this.onToggle(item, path)}
            >
              ${body}
            </button>`
          : html`<a
              part="item"
              class=${classes}
              style=${inset}
              href=${item.href ?? '#'}
              aria-current=${active ? 'page' : nothing}
              aria-disabled=${item.disabled ? 'true' : nothing}
              @click=${(event: MouseEvent) => this.onSelect(event, item)}
            >
              ${body}
            </a>`
      }
      ${
        branch && open
          ? html`<div class="children">${this.renderItems(item.children!, depth + 1, path)}</div>`
          : nothing
      }
    </li>`;
  }

  override render(): TemplateResult {
    return html`<nav part="nav" aria-label=${this.label}>
      ${this.sections.map(
        (section, index) =>
          html`<div part="section">
            ${section.title ? html`<h6 part="title" class="title">${section.title}</h6>` : nothing}
            ${this.renderItems(section.items, 0, String(index))}
          </div>`,
      )}
    </nav>`;
  }
}

defineElement('kt-sub-menu-navigation', KtSubMenuNavigation);

declare global {
  interface HTMLElementTagNameMap {
    'kt-sub-menu-navigation': KtSubMenuNavigation;
  }
}
