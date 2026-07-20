import { css, html, nothing, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { KtElement, defineElement } from '../../internal/kt-element.js';
import { emit } from '../../internal/events.js';

export interface KtNavItem {
  readonly label: string;
  readonly href?: string;
  readonly active?: boolean;
}

export interface KtNavSection {
  readonly title?: string;
  readonly items: readonly KtNavItem[];
}

/**
 * The sidebar navigation: uppercase overline section titles over lists of
 * links.
 *
 * @element kt-sub-menu-navigation
 *
 * @csspart nav - The `<nav>`.
 * @csspart section - A section.
 * @csspart title - A section title.
 * @csspart item - A navigation link.
 *
 * @fires kt-navigate - A link was activated. `detail: { item }`. Cancel it to
 *   keep the browser from following the href, for client-side routing.
 *
 * @example
 * ```js
 * nav.sections = [
 *   { title: 'Forms', items: [{ label: 'Input', href: '/input' }] },
 * ];
 * nav.activeHref = '/input';
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

      .title {
        margin: 0;
        padding: 0.2rem 0;
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

      .item {
        display: flex;
        align-items: flex-start;
        justify-content: flex-start;
        gap: 12px;
        padding: var(--padding-sub-menu-item);
        color: var(--text-muted);
        font: var(--font-normal-regular);
        border-radius: var(--radius-input);
        cursor: pointer;
        text-decoration: none;
      }

      .item:hover {
        background-color: var(--color-dark-18);
        text-decoration: none;
      }

      .item:focus-visible {
        outline: var(--outline-width) solid var(--color-primary-base);
        outline-offset: -2px;
      }

      .active {
        color: var(--text-body);
        background-color: var(--color-dark-19);
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

  private isActive(item: KtNavItem): boolean {
    return item.active === true || (this.activeHref !== '' && item.href === this.activeHref);
  }

  private onSelect(event: MouseEvent, item: KtNavItem): void {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;

    const proceed = emit(this, 'kt-navigate', { item });
    if (proceed.defaultPrevented) event.preventDefault();
  }

  override render(): TemplateResult {
    return html`<nav part="nav" aria-label=${this.label}>
      ${this.sections.map(
        (section) =>
          html`<div part="section">
            ${section.title ? html`<h6 part="title" class="title">${section.title}</h6>` : nothing}
            <ul>
              ${section.items.map((item) => {
                const active = this.isActive(item);
                return html`<li>
                  <a
                    part="item"
                    class=${classMap({ item: true, active })}
                    href=${item.href ?? '#'}
                    aria-current=${active ? 'page' : nothing}
                    @click=${(event: MouseEvent) => this.onSelect(event, item)}
                    >${item.label}</a
                  >
                </li>`;
              })}
            </ul>
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
