import { css, html, nothing, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { KtElement, defineElement } from '../../../internal/kt-element.js';
import { emit } from '../../../internal/events.js';
import '../../core/kt-button/kt-button.js';

/**
 * The application header: a banner landmark holding the brand, the primary
 * navigation and a row of actions.
 *
 * Below `--kt-header-breakpoint` (900px by default) the navigation collapses
 * behind a menu button and reappears as a panel under the bar. That threshold
 * is a token rather than a hard-coded media query, because how much navigation
 * fits depends on how much navigation you put in.
 *
 * @element kt-header
 *
 * @slot brand - Logo or wordmark, at the start.
 * @slot - Primary navigation, in the middle.
 * @slot actions - Buttons and links, at the end. Stays visible on mobile.
 * @slot menu - What the menu button reveals below the breakpoint. Separate
 *   from the default slot because a node can only be assigned to one slot; put
 *   a compact copy of the navigation here.
 * @slot bottom - A second row under the bar — sub-navigation, a breadcrumb.
 *
 * @csspart base - The `<header>`.
 * @csspart bar - The main row.
 * @csspart bottom - The second row.
 *
 * @cssproperty --kt-header-breakpoint - Where the navigation collapses. 900px.
 * @cssproperty --kt-header-height - Height of the main row. 64px.
 *
 * @fires kt-menu-toggle - The mobile menu opened or closed. `detail: { open }`.
 *
 * @example
 * ```html
 * <kt-header sticky>
 *   <a slot="brand" href="/">KANTO</a>
 *   <nav><a href="/docs">Docs</a><a href="/components">Components</a></nav>
 *   <kt-button slot="actions" size="small" icon="github" label="GitHub"></kt-button>
 * </kt-header>
 * ```
 */
export class KtHeader extends KtElement {
  static override styles = [
    KtElement.styles,
    css`
      :host {
        display: block;
        --kt-header-height: 64px;
        --kt-header-breakpoint: 900px;
      }

      :host([sticky]) {
        position: sticky;
        top: 0;
        z-index: var(--z-dropdown);
      }

      header {
        background-color: var(--surface-page);
      }

      /* Translucent only where the browser can actually blur; an unblurred
         semi-transparent bar is just hard to read. */
      @supports (backdrop-filter: blur(1px)) {
        :host([sticky]) header {
          background-color: color-mix(in srgb, var(--surface-page) 80%, transparent);
          backdrop-filter: blur(12px);
        }
      }

      :host([bordered]) header {
        border-bottom: var(--border-width) solid var(--border-subtle);
      }

      .bar {
        display: flex;
        align-items: center;
        gap: var(--gap-card);
        min-height: var(--kt-header-height);
        padding: 0 var(--padding-card);
      }

      .brand {
        display: flex;
        flex: none;
        align-items: center;
        gap: var(--gap-button);
        color: var(--text-body);
        font: var(--font-title-h6);
      }

      .nav {
        display: flex;
        flex: 1;
        align-items: center;
        min-width: 0;
      }

      .actions {
        display: flex;
        flex: none;
        align-items: center;
        gap: var(--gap-button);
      }

      .bottom {
        padding: 0 var(--padding-card);
      }

      /* Hidden above the breakpoint; the container query cannot help here
         because the header spans the viewport by definition. */
      .menu-button {
        display: none;
        flex: none;
      }

      .panel {
        display: none;
      }

      @media (max-width: 899px) {
        .menu-button {
          display: inline-flex;
        }

        .nav {
          display: none;
        }

        .panel.open {
          display: block;
          padding: 0 var(--padding-card) var(--padding-form);
          border-top: var(--border-width) solid var(--border-subtle);
        }
      }
    `,
  ];

  @state()
  private menuOpen = false;

  /** Pins the header to the top of the viewport. */
  @property({ type: Boolean, reflect: true })
  sticky = false;

  @property({ type: Boolean, reflect: true })
  bordered = true;

  /** Accessible name for the banner, when a page has more than one. */
  @property({ type: String })
  label = '';

  /** Whether the collapsed navigation panel is showing. */
  get isMenuOpen(): boolean {
    return this.menuOpen;
  }

  /** Closes the collapsed navigation — call it after routing. */
  closeMenu(): void {
    if (!this.menuOpen) return;
    this.menuOpen = false;
    emit(this, 'kt-menu-toggle', { open: false });
  }

  private toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
    emit(this, 'kt-menu-toggle', { open: this.menuOpen });
  }

  override render(): TemplateResult {
    return html`<header part="base" role="banner" aria-label=${this.label || nothing}>
      <div part="bar" class="bar">
        <div class="brand"><slot name="brand"></slot></div>

        <div class="nav"><slot></slot></div>

        <div class="actions"><slot name="actions"></slot></div>

        <kt-button
          class="menu-button"
          variant="secondary-no-bg"
          size="small"
          icon=${this.menuOpen ? 'x' : 'menu'}
          label=${this.menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded=${this.menuOpen ? 'true' : 'false'}
          @click=${this.toggleMenu}
        ></kt-button>
      </div>

      <div class="panel ${this.menuOpen ? 'open' : ''}">
        <slot name="menu"></slot>
      </div>

      <div part="bottom" class="bottom"><slot name="bottom"></slot></div>
    </header>`;
  }
}

defineElement('kt-header', KtHeader);

declare global {
  interface HTMLElementTagNameMap {
    'kt-header': KtHeader;
  }
}
