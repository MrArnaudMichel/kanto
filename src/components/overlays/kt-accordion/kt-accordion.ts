import { css, html, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { KtElement, defineElement } from '#internal/kt-element';
import { emit } from '#internal/events';
import type { KtCollapsible } from '../kt-collapsible/kt-collapsible.js';

/**
 * A set of `kt-collapsible` sections that open one at a time: opening one
 * folds the one that was open, so the page stays the length of one answer.
 * `multiple` lets each open on its own.
 *
 * The arrows, Home and End move between the sections' summaries, as the
 * WAI-ARIA accordion pattern describes; Enter and Space open them, as they
 * always do.
 *
 * @element kt-accordion
 *
 * @slot - The `kt-collapsible` sections.
 *
 * @fires kt-change - A section opened or closed. `detail: { open }`, the indexes of the open sections.
 *
 * @example
 * ```html
 * <kt-accordion>
 *   <kt-collapsible heading="Shipping">Three to five days.</kt-collapsible>
 *   <kt-collapsible heading="Returns">Thirty days, no questions.</kt-collapsible>
 * </kt-accordion>
 * ```
 */
export class KtAccordion extends KtElement {
  static override styles = [
    KtElement.styles,
    css`
      :host {
        display: block;
      }
      /* The sections' rules run between them; one along the top closes the set. */
      ::slotted(kt-collapsible:first-child) {
        border-top: var(--border-width) solid var(--border-subtle);
      }
    `,
  ];

  /** Lets each section open on its own, instead of one at a time. */
  @property({ type: Boolean, reflect: true })
  multiple = false;

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('kt-toggle', this.onToggle);
    this.addEventListener('keydown', this.onKeyDown);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('kt-toggle', this.onToggle);
    this.removeEventListener('keydown', this.onKeyDown);
  }

  /** The sections, in order: the direct `kt-collapsible` children. */
  get sections(): KtCollapsible[] {
    return [...this.children].filter(
      (child): child is KtCollapsible => child.localName === 'kt-collapsible',
    );
  }

  /** The first slotchange can land after the first render; settle once directly as well. */
  override firstUpdated(): void {
    this.settle();
  }

  /** One open at a time: of several opened in the markup, the first stays. */
  private settle(): void {
    if (this.multiple) return;
    let seen = false;
    for (const section of this.sections) {
      if (!section.open) continue;
      if (seen) section.open = false;
      seen = true;
    }
  }

  private onToggle = (event: Event): void => {
    const opened = event.target as KtCollapsible;
    if (opened.parentElement !== this) return;
    if (!this.multiple && opened.open) {
      for (const section of this.sections) if (section !== opened) section.open = false;
    }
    const open = this.sections.flatMap((section, index) => (section.open ? [index] : []));
    emit(this, 'kt-change', { open });
  };

  private onKeyDown = (event: KeyboardEvent): void => {
    const from = event.target as Element;
    // From a section's summary only: keys inside its content are its own.
    if (
      from.parentElement !== this ||
      (event.composedPath()[0] as Element).localName !== 'summary'
    ) {
      return;
    }
    const sections = this.sections;
    const index = sections.indexOf(from as KtCollapsible);
    const to = {
      ArrowDown: (index + 1) % sections.length,
      ArrowUp: (index - 1 + sections.length) % sections.length,
      Home: 0,
      End: sections.length - 1,
    }[event.key];
    if (to === undefined) return;
    event.preventDefault();
    sections[to]?.focus();
  };

  override render(): TemplateResult {
    return html`<slot @slotchange=${() => this.settle()}></slot>`;
  }
}

defineElement('kt-accordion', KtAccordion);

declare global {
  interface HTMLElementTagNameMap {
    'kt-accordion': KtAccordion;
  }
}
