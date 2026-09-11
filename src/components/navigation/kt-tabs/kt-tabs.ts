import { css, html, nothing, type TemplateResult } from 'lit';
import { property, queryAll } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { KtElement, defineElement } from 'kanto/internal/kt-element';
import { emit } from 'kanto/internal/events';
import '../../core/kt-icon/kt-icon.js';
import '../../feedback/kt-skeleton/kt-skeleton.js';

export interface KtTab {
  readonly value: string | number;
  readonly label?: string;
  /** Lucide icon name, kebab-case. */
  readonly icon?: string;
  readonly disabled?: boolean;
  /** id of the element this tab controls, for `aria-controls`. */
  readonly panel?: string;
}

/**
 * An underlined tab bar.
 *
 * Against `<kt-segmented-control>`: a segmented control picks a *value* — a
 * date range, a unit — and sits inside a form or a toolbar. Tabs switch which
 * *region of the page* you are looking at, and read as part of the page
 * structure rather than as a control on it. The shapes say so: an inset track
 * with a raised pill, versus a rule with one segment underlined.
 *
 * Like the segmented control, this only manages selection. Swapping the panel
 * is the consumer's business.
 *
 * @element kt-tabs
 *
 * @csspart base - The tablist.
 * @csspart tab - One tab.
 *
 * @fires kt-change - A tab was selected. `detail: { value, tab }`.
 *
 * @example
 * ```js
 * tabs.tabs = [
 *   { value: 'usage', label: 'Usage' },
 *   { value: 'api', label: 'API', icon: 'code' },
 * ];
 * ```
 */
export class KtTabs extends KtElement {
  static override styles = [
    KtElement.styles,
    css`
      :host {
        display: block;
      }

      .tablist {
        display: flex;
        gap: var(--gap-drag-drop);
        border-bottom: var(--border-width) solid var(--border-subtle);
        overflow-x: auto;
        scrollbar-width: none;
      }

      .tablist::-webkit-scrollbar {
        display: none;
      }

      :host([disabled]) .tablist {
        opacity: 0.5;
        pointer-events: none;
      }

      .tab {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        /* The -1px pulls the active underline over the container's rule so the
           two read as one line rather than two stacked ones. */
        margin-bottom: calc(var(--border-width) * -1);
        padding: 10px 2px;
        color: var(--text-muted);
        font: var(--font-normal-medium);
        white-space: nowrap;
        background: transparent;
        border: none;
        border-bottom: 2px solid transparent;
        cursor: pointer;
        transition:
          color var(--duration-instant),
          border-color var(--duration-instant);
      }

      .tab:hover:not(:disabled) {
        color: var(--text-body);
      }

      .tab.selected {
        color: var(--text-body);
        border-bottom-color: var(--color-primary-base);
      }

      .tab:disabled {
        color: var(--text-disabled);
        cursor: not-allowed;
      }

      .tab:focus-visible {
        outline: var(--outline-width) solid var(--color-primary-base);
        outline-offset: 2px;
        border-radius: 4px;
      }

      .loading {
        display: flex;
        gap: var(--gap-drag-drop);
        padding: 10px 0;
      }
    `,
  ];

  @queryAll('.tab')
  private tabElements!: NodeListOf<HTMLButtonElement>;

  /** The tabs to show. A property: this is data. */
  @property({ attribute: false })
  tabs: readonly KtTab[] = [];

  /** The selected tab's value. */
  @property({ type: String })
  value: string | number | null = null;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  /** Renders placeholder tabs instead of the real ones. */
  @property({ type: Boolean, reflect: true })
  loading = false;

  /** Accessible name for the tablist. */
  @property({ type: String })
  label = '';

  private get selectedIndex(): number {
    return this.tabs.findIndex((tab) => tab.value === this.value);
  }

  private select(tab: KtTab): void {
    if (tab.disabled || this.value === tab.value) return;
    this.value = tab.value;
    emit(this, 'kt-change', { value: tab.value, tab });
  }

  /** Moves to the next selectable tab in `direction`, wrapping at both ends. */
  private step(direction: 1 | -1): number | undefined {
    const count = this.tabs.length;
    if (count === 0) return undefined;

    const from = this.selectedIndex < 0 ? (direction === 1 ? -1 : 0) : this.selectedIndex;
    for (let offset = 1; offset <= count; offset += 1) {
      const index = (((from + direction * offset) % count) + count) % count;
      if (!this.tabs[index]?.disabled) return index;
    }
    return undefined;
  }

  private onKeyDown(event: KeyboardEvent): void {
    let target: number | undefined;

    if (event.key === 'ArrowRight') target = this.step(1);
    else if (event.key === 'ArrowLeft') target = this.step(-1);
    else if (event.key === 'Home') target = this.tabs.findIndex((tab) => !tab.disabled);
    else if (event.key === 'End')
      target = this.tabs.length - 1 - [...this.tabs].reverse().findIndex((tab) => !tab.disabled);
    else return;

    event.preventDefault();
    if (target === undefined || target < 0) return;

    const tab = this.tabs[target];
    if (!tab) return;

    const index = target;
    this.select(tab);
    void this.updateComplete.then(() => this.tabElements[index]?.focus());
  }

  override render(): TemplateResult {
    if (this.loading) {
      return html`<div class="loading" aria-hidden="true">
        ${[0, 1, 2].map(() => html`<kt-skeleton variant="rect" width="64px" height="22px"></kt-skeleton>`)}
      </div>`;
    }

    const selectedIndex = this.selectedIndex;
    // One tab stop for the whole bar, as a tablist should have.
    const tabStop = selectedIndex >= 0 ? selectedIndex : this.tabs.findIndex((t) => !t.disabled);

    return html`<div
      part="base"
      class="tablist"
      role="tablist"
      aria-label=${this.label || nothing}
      @keydown=${this.onKeyDown}
    >
      ${this.tabs.map((tab, index) => {
        const selected = tab.value === this.value;

        return html`<button
          part="tab"
          type="button"
          role="tab"
          class=${classMap({ tab: true, selected })}
          aria-selected=${selected ? 'true' : 'false'}
          aria-controls=${tab.panel ?? nothing}
          tabindex=${index === tabStop ? 0 : -1}
          ?disabled=${this.disabled || tab.disabled}
          @click=${() => this.select(tab)}
        >
          ${tab.icon ? html`<kt-icon name=${tab.icon} size="16"></kt-icon>` : nothing}
          ${tab.label ?? String(tab.value)}
        </button>`;
      })}
    </div>`;
  }
}

defineElement('kt-tabs', KtTabs);

declare global {
  interface HTMLElementTagNameMap {
    'kt-tabs': KtTabs;
  }
}
