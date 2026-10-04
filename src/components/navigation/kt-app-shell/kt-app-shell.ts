import { css, html, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { KtElement, defineElement } from '#internal/kt-element';
import { emit, uniqueId } from '#internal/events';
import { strings } from '#internal/strings';
import '../../core/kt-button/kt-button.js';

/**
 * The frame of an application: a header along the top, a sidebar down the
 * side, and the content, which scrolls on its own.
 *
 * Wide, the sidebar sits beside the content, and its toggle narrows it to a
 * rail (`collapsed`). Narrower than `breakpoint` — measured on the shell
 * itself, not the viewport — the sidebar leaves the layout: the toggle opens
 * it as a drawer over the content, behind a backdrop, closed by Escape or a
 * click outside. A closed drawer is inert, so Tab never wanders into it.
 *
 * The shell fills its container's height; give the container one —
 * `height: 100dvh` on a page, a fixed height in a preview.
 *
 * @element kt-app-shell
 *
 * @slot header - The top bar: a wordmark, a search, an account menu.
 * @slot sidebar - Down the side: the application's navigation.
 * @slot - The content.
 *
 * @csspart header - The top bar.
 * @csspart sidebar - The `<aside>`.
 * @csspart main - The `<main>`.
 * @csspart toggle - The sidebar's toggle.
 *
 * @cssproperty --kt-app-shell-sidebar-width - The sidebar's width. 240px.
 * @cssproperty --kt-app-shell-rail-width - Its width when collapsed. 64px.
 * @cssproperty --kt-app-shell-header-height - The top bar's height. 56px.
 *
 * @fires kt-sidebar-toggle - The sidebar opened or closed — collapsed or
 *   expanded when wide, the drawer when narrow. `detail: { open }`.
 *
 * @example
 * ```html
 * <kt-app-shell style="height: 100dvh">
 *   <a slot="header" href="/">Northwind</a>
 *   <kt-sub-menu-navigation slot="sidebar"></kt-sub-menu-navigation>
 *   <h1>Overview</h1>
 * </kt-app-shell>
 * ```
 */
export class KtAppShell extends KtElement {
  static override styles = [
    KtElement.styles,
    css`
      :host {
        display: block;
        height: 100%;
        --kt-app-shell-sidebar-width: 240px;
        --kt-app-shell-rail-width: 64px;
        --kt-app-shell-header-height: 56px;
      }

      .shell {
        position: relative;
        display: grid;
        grid-template:
          'header header' auto
          'sidebar main' minmax(0, 1fr)
          / var(--kt-app-shell-sidebar-width) minmax(0, 1fr);
        height: 100%;
        overflow: hidden;
        color: var(--text-body);
        background: var(--surface-page);
        transition: grid-template-columns var(--duration-normal) var(--easing-standard);
      }
      :host([collapsed]:not([narrow])) .shell {
        grid-template-columns: var(--kt-app-shell-rail-width) minmax(0, 1fr);
      }

      .header {
        grid-area: header;
        display: flex;
        align-items: center;
        gap: var(--gap-form);
        min-height: var(--kt-app-shell-header-height);
        padding: 0 var(--padding-form);
        border-bottom: var(--border-width) solid var(--border-subtle);
      }
      .header-content {
        display: flex;
        flex: 1;
        align-items: center;
        gap: var(--gap-form);
        min-width: 0;
      }

      aside {
        grid-area: sidebar;
        min-width: 0;
        overflow: hidden auto;
        background: var(--surface-page);
        border-right: var(--border-width) solid var(--border-subtle);
        outline: none;
      }

      main {
        grid-area: main;
        min-width: 0;
        overflow: auto;
      }

      .backdrop {
        display: none;
      }

      /* === Narrow: the sidebar is a drawer over the content === */
      :host([narrow]) .shell {
        grid-template:
          'header' auto
          'main' minmax(0, 1fr)
          / minmax(0, 1fr);
      }
      :host([narrow]) aside {
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        z-index: 2;
        width: min(var(--kt-app-shell-sidebar-width), 85%);
        box-shadow: var(--shadow-popover);
        translate: -100% 0;
        visibility: hidden;
        transition:
          translate var(--duration-normal) var(--easing-standard),
          visibility 0s linear var(--duration-normal);
      }
      :host([narrow][sidebar-open]) aside {
        translate: 0 0;
        visibility: visible;
        transition: translate var(--duration-normal) var(--easing-standard);
      }
      :host([narrow][sidebar-open]) .backdrop {
        position: absolute;
        inset: 0;
        z-index: 1;
        display: block;
        background: var(--color-backdrop);
      }
    `,
  ];

  /** Wide: the sidebar narrowed to a rail. */
  @property({ type: Boolean, reflect: true })
  collapsed = false;

  /** Narrow: the sidebar open as a drawer. */
  @property({ type: Boolean, reflect: true, attribute: 'sidebar-open' })
  sidebarOpen = false;

  /** Below this width, in pixels of the shell itself, the sidebar becomes a drawer. */
  @property({ type: Number })
  breakpoint = 900;

  /** Leaves the toggle out, for a header that brings its own. */
  @property({ type: Boolean, attribute: 'no-toggle' })
  noToggle = false;

  /** Accessible name for the sidebar. Defaults to the translated "Sidebar". */
  @property({ type: String })
  label = '';

  /** Narrower than `breakpoint`: reflected as the `narrow` attribute, for styling. */
  @state() private narrow = false;

  @query('aside') private aside!: HTMLElement;
  @query('.toggle') private toggle?: HTMLElement;

  private readonly sidebarId = uniqueId('kt-app-shell-sidebar');
  private observer: ResizeObserver | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('keydown', this.onKeyDown);
    if (typeof ResizeObserver === 'function') {
      this.observer = new ResizeObserver(([entry]) => {
        if (entry) this.measure(entry.contentRect.width);
      });
      this.observer.observe(this);
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('keydown', this.onKeyDown);
    this.observer?.disconnect();
    this.observer = null;
  }

  private measure(width: number): void {
    const narrow = width > 0 && width < this.breakpoint;
    if (narrow === this.narrow) return;
    this.narrow = narrow;
    if (!narrow) this.sidebarOpen = false;
  }

  /** Whether the sidebar shows: expanded when wide, open when narrow. */
  private get open(): boolean {
    return this.narrow ? this.sidebarOpen : !this.collapsed;
  }

  /** Opens or closes the sidebar, as its toggle does. */
  toggleSidebar(): void {
    if (this.narrow) this.sidebarOpen = !this.sidebarOpen;
    else this.collapsed = !this.collapsed;
    emit(this, 'kt-sidebar-toggle', { open: this.open });
  }

  private closeDrawer(): void {
    if (!this.narrow || !this.sidebarOpen) return;
    this.sidebarOpen = false;
    emit(this, 'kt-sidebar-toggle', { open: false });
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && this.narrow && this.sidebarOpen) {
      event.preventDefault();
      this.closeDrawer();
    }
  };

  override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has('breakpoint')) this.measure(this.getBoundingClientRect().width);
  }

  // `narrow` is private, so the map is read untyped.
  override updated(changed: PropertyValues): void {
    super.updated(changed);
    this.toggleAttribute('narrow', this.narrow);
    if (!changed.has('sidebarOpen') || !this.narrow) return;
    // The drawer takes the focus as it opens, and gives it back as it closes.
    if (this.sidebarOpen) this.aside.focus();
    else if (changed.get('sidebarOpen') === true) this.toggle?.focus();
  }

  override render(): TemplateResult {
    const label = this.label || strings().sidebar;
    return html`<div class="shell">
      <div part="header" class="header">
        ${
          this.noToggle
            ? nothing
            : html`<kt-button
                part="toggle"
                class="toggle"
                variant="secondary-no-bg"
                size="small"
                icon=${this.narrow ? 'menu' : 'panel-left'}
                label=${label}
                aria-controls=${this.sidebarId}
                aria-expanded=${this.open ? 'true' : 'false'}
                @click=${() => this.toggleSidebar()}
              ></kt-button>`
        }
        <div class="header-content"><slot name="header"></slot></div>
      </div>
      <aside
        part="sidebar"
        id=${this.sidebarId}
        aria-label=${label}
        tabindex="-1"
        ?inert=${this.narrow && !this.sidebarOpen}
      >
        <slot name="sidebar"></slot>
      </aside>
      <div class="backdrop" @click=${() => this.closeDrawer()}></div>
      <main part="main"><slot></slot></main>
    </div>`;
  }
}

defineElement('kt-app-shell', KtAppShell);

declare global {
  interface HTMLElementTagNameMap {
    'kt-app-shell': KtAppShell;
  }
}
