import { css, html, nothing, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import { KtElement, defineElement } from '#internal/kt-element';
import { emit } from '#internal/events';
import '../../core/kt-icon/kt-icon.js';

export interface KtTreeItem {
  readonly id: string;
  readonly label: string;
  /** A Lucide icon name, before the label. */
  readonly icon?: string;
  readonly children?: readonly KtTreeItem[];
}

/** A node as drawn: where it sits, and among how many. */
interface Row {
  readonly item: KtTreeItem;
  readonly level: number;
  readonly position: number;
  readonly size: number;
  readonly parent: string | null;
}

/**
 * Things inside things — folders and files, an organisation's teams, nested
 * pages — as a tree to open and walk.
 *
 * The nodes are data: `tree.items = [{ id, label, icon, children }]`;
 * `expanded` lists the open ones and `selected` the chosen one. A click on a
 * node selects it, a click on its chevron opens or closes it.
 *
 * The keyboard is the WAI-ARIA tree view's: Up and Down move through the
 * visible nodes; Right opens a node, then moves to its first child; Left closes
 * it, or moves to its parent; Home and End go to the first and last; Enter and
 * Space select. The tree is one tab stop.
 *
 * @element kt-tree
 *
 * @csspart tree - The tree.
 * @csspart item - One node's row.
 *
 * @fires kt-select - A node was selected. `detail: { id, item }`.
 * @fires kt-toggle - A node opened or closed. `detail: { id, expanded }`.
 *
 * @example
 * ```html
 * <kt-tree label="Files"></kt-tree>
 * <script>
 *   tree.items = [
 *     { id: 'src', label: 'src', icon: 'folder', children: [{ id: 'index', label: 'index.ts', icon: 'file' }] },
 *   ];
 *   tree.expanded = ['src'];
 * </script>
 * ```
 */
export class KtTree extends KtElement {
  static override styles = [
    KtElement.styles,
    css`
      :host {
        display: block;
      }

      [role='tree'] {
        display: grid;
        gap: 1px;
        margin: 0;
        padding: 0;
        list-style: none;
      }

      .row {
        display: flex;
        gap: 6px;
        align-items: center;
        min-height: var(--button-height-small);
        padding: 0 8px 0 calc(8px + (var(--level) - 1) * 20px);
        color: var(--text-body);
        font: var(--font-normal-regular);
        border-radius: var(--radius-input);
        outline: none;
        cursor: pointer;
        user-select: none;
      }
      .row:hover {
        background: var(--surface-hover);
      }
      .row:focus-visible {
        box-shadow: inset 0 0 0 var(--outline-width) var(--color-primary-base);
      }
      .row[aria-selected='true'] {
        color: var(--color-primary-text);
        background: var(--color-primary-soft);
      }

      .chevron,
      .spacer {
        display: inline-grid;
        flex: none;
        place-items: center;
        width: 18px;
        height: 18px;
        color: var(--text-muted);
      }
      .chevron {
        border-radius: var(--radius-sub-menu);
        transition: transform var(--duration-fast) var(--easing-standard);
      }
      .chevron:hover {
        color: var(--text-body);
      }
      .row[aria-expanded='true'] .chevron {
        transform: rotate(90deg);
      }

      .icon {
        flex: none;
        color: var(--text-muted);
      }
      .row[aria-selected='true'] .icon {
        color: var(--color-primary-text);
      }
      .label {
        min-width: 0;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
    `,
  ];

  /** The nodes. Set as a property: `tree.items = [...]`. */
  @property({ attribute: false })
  items: readonly KtTreeItem[] = [];

  /** The ids of the open nodes. */
  @property({ attribute: false })
  expanded: readonly string[] = [];

  /** The id of the selected node. */
  @property({ type: String })
  selected = '';

  /** Accessible name for the tree. */
  @property({ type: String })
  label = '';

  /** The node holding the tab stop, as the keyboard moves it. */
  @state() private active = '';

  /** The visible nodes, in order: a node's children follow it while it is open. */
  private get rows(): Row[] {
    const open = new Set(this.expanded);
    const out: Row[] = [];
    const walk = (items: readonly KtTreeItem[], level: number, parent: string | null) => {
      items.forEach((item, index) => {
        out.push({ item, level, position: index + 1, size: items.length, parent });
        if (item.children?.length && open.has(item.id)) walk(item.children, level + 1, item.id);
      });
    };
    walk(this.items, 1, null);
    return out;
  }

  private isOpen(id: string): boolean {
    return this.expanded.includes(id);
  }

  /** Opens or closes a node, and says so. */
  toggle(id: string, expanded = !this.isOpen(id)): void {
    if (expanded === this.isOpen(id)) return;
    this.expanded = expanded ? [...this.expanded, id] : this.expanded.filter((open) => open !== id);
    emit(this, 'kt-toggle', { id, expanded });
  }

  private select(row: Row): void {
    this.selected = row.item.id;
    this.active = row.item.id;
    emit(this, 'kt-select', { id: row.item.id, item: row.item });
  }

  private focusRow(id: string): void {
    this.active = id;
    void this.updateComplete.then(() => {
      this.shadowRoot?.querySelector<HTMLElement>(`[data-id="${CSS.escape(id)}"]`)?.focus();
    });
  }

  private onKeyDown(event: KeyboardEvent, row: Row, index: number): void {
    const rows = this.rows;
    const branch = Boolean(row.item.children?.length);
    const go = (to: number) => {
      const target = rows[Math.max(0, Math.min(rows.length - 1, to))];
      if (target) this.focusRow(target.item.id);
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
        go(rows.length - 1);
        break;
      case 'ArrowRight':
        if (!branch) return;
        if (!this.isOpen(row.item.id)) this.toggle(row.item.id, true);
        else go(index + 1);
        break;
      case 'ArrowLeft':
        if (branch && this.isOpen(row.item.id)) this.toggle(row.item.id, false);
        else if (row.parent) this.focusRow(row.parent);
        else return;
        break;
      case 'Enter':
      case ' ':
        this.select(row);
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  override render(): TemplateResult {
    const rows = this.rows;
    const stop =
      rows.find((row) => row.item.id === this.active) ??
      rows.find((row) => row.item.id === this.selected) ??
      rows[0];
    return html`<ul part="tree" role="tree" aria-label=${this.label || nothing}>
      ${rows.map((row, index) => {
        const branch = Boolean(row.item.children?.length);
        return html`<li
          part="item"
          class=${classMap({ row: true })}
          role="treeitem"
          data-id=${row.item.id}
          style=${styleMap({ '--level': String(row.level) })}
          tabindex=${row === stop ? 0 : -1}
          aria-level=${row.level}
          aria-setsize=${row.size}
          aria-posinset=${row.position}
          aria-expanded=${branch ? String(this.isOpen(row.item.id)) : nothing}
          aria-selected=${row.item.id === this.selected ? 'true' : 'false'}
          @click=${() => this.select(row)}
          @focus=${() => (this.active = row.item.id)}
          @keydown=${(event: KeyboardEvent) => this.onKeyDown(event, row, index)}
        >
          ${
            branch
              ? html`<span
                  class="chevron"
                  aria-hidden="true"
                  @click=${(event: Event) => {
                    event.stopPropagation();
                    this.toggle(row.item.id);
                  }}
                  ><kt-icon name="chevron-right" size="14"></kt-icon
                ></span>`
              : html`<span class="spacer" aria-hidden="true"></span>`
          }
          ${
            row.item.icon
              ? html`<kt-icon class="icon" name=${row.item.icon} size="16"></kt-icon>`
              : nothing
          }
          <span class="label">${row.item.label}</span>
        </li>`;
      })}
    </ul>`;
  }
}

defineElement('kt-tree', KtTree);

declare global {
  interface HTMLElementTagNameMap {
    'kt-tree': KtTree;
  }
}
