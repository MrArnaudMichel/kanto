import { css, html, nothing, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { KtElement, defineElement } from '#internal/kt-element';
import { emit } from '#internal/events';
import { strings } from '#internal/strings';
import '../../core/kt-icon/kt-icon.js';

export interface KtBreadcrumbItem {
  readonly label: string;
  readonly href?: string;
}

/**
 * A trail showing where the current page sits.
 *
 * The last entry is the current page: rendered as text, not a link, and marked
 * `aria-current="page"`. A breadcrumb whose final item links to the page you
 * are already on is a dead control.
 *
 * @element kt-breadcrumb
 *
 * @csspart nav - The `<nav>`.
 * @csspart item - A trail entry.
 *
 * @fires kt-navigate - An entry was activated. `detail: { item, index }`.
 *   Cancel it to keep the browser from following the href.
 *
 * @example
 * ```js
 * trail.items = [
 *   { label: 'Home', href: '/' },
 *   { label: 'Entities', href: '/entities' },
 *   { label: 'Entity 4812' },
 * ];
 * ```
 */
export class KtBreadcrumb extends KtElement {
  static override styles = [
    KtElement.styles,
    css`
      :host {
        display: block;
      }

      nav {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
      }

      .item {
        padding: 2px 6px;
        color: var(--text-muted);
        font: var(--font-normal-regular);
        border-radius: 6px;
        text-decoration: none;
      }

      a.item:hover {
        color: var(--text-body);
        background: var(--color-dark-18);
        text-decoration: none;
      }

      a.item:focus-visible {
        outline: var(--outline-width) solid var(--color-primary-base);
        outline-offset: 1px;
      }

      .current {
        color: var(--text-body);
        font: var(--font-normal-medium);
      }

      .separator {
        display: inline-flex;
        color: var(--color-text-600);
      }
    `,
  ];

  /** The trail, root first. The last entry is the current page. */
  @property({ attribute: false })
  items: readonly KtBreadcrumbItem[] = [];

  /** Accessible name for the navigation landmark. */
  @property({ type: String })
  label: string | undefined = undefined;

  private onSelect(event: MouseEvent, item: KtBreadcrumbItem, index: number): void {
    // Let modified clicks through: they open a new tab, which is the user
    // asking the browser for something we should not intercept.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;

    const proceed = emit(this, 'kt-navigate', { item, index });
    if (!proceed.defaultPrevented) return;
    event.preventDefault();
  }

  override render(): TemplateResult {
    const lastIndex = this.items.length - 1;

    return html`<nav part="nav" aria-label=${this.label ?? strings().breadcrumb}>
      ${this.items.map((item, index) =>
        index === lastIndex
          ? html`<span part="item" class="item current" aria-current="page">${item.label}</span>`
          : html`<a
                part="item"
                class="item"
                href=${item.href ?? '#'}
                @click=${(event: MouseEvent) => this.onSelect(event, item, index)}
                >${item.label}</a
              >
              <span class="separator" aria-hidden="true">
                <kt-icon name="chevron-right" size="14"></kt-icon>
              </span>`,
      )}
      ${this.items.length === 0 ? nothing : ''}
    </nav>`;
  }
}

defineElement('kt-breadcrumb', KtBreadcrumb);

declare global {
  interface HTMLElementTagNameMap {
    'kt-breadcrumb': KtBreadcrumb;
  }
}
