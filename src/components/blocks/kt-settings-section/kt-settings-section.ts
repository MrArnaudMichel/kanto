import { css, html, nothing, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { KtElement, defineElement } from '#internal/kt-element';
import { blockId } from '#internal/block';
import { heading } from '#internal/heading';
import { hasAssignedContent } from '#internal/slots';

export type KtSettingsSectionLayout = 'split' | 'stacked';

/**
 * One part of a settings page: what it is about, the fields that change it,
 * and the button that saves them.
 *
 * `split`, the default, sets the heading and its description beside the
 * fields once the section is wide enough — the settings page most products
 * have; `stacked` puts them over the fields. `danger` marks the section that
 * deletes things.
 *
 * @element kt-settings-section
 *
 * @slot - The fields.
 * @slot actions - In the footer, at the end: Save, Cancel.
 * @slot note - In the footer, at the start: when it was last saved, what saving does.
 *
 * @csspart base - The section.
 * @csspart card - The fields and the footer.
 * @csspart footer - The footer.
 *
 * @example
 * ```html
 * <kt-settings-section heading="Profile" description="How others see you in the workspace.">
 *   <kt-label-input label="Name"><kt-input value="Ada Park"></kt-input></kt-label-input>
 *   <kt-button slot="actions">Save</kt-button>
 * </kt-settings-section>
 * ```
 */
export class KtSettingsSection extends KtElement {
  static override styles = [
    KtElement.styles,
    css`
      :host {
        display: block;
        container-type: inline-size;
      }

      section {
        display: grid;
        gap: var(--gap-card);
      }
      @container (min-width: 760px) {
        :host([layout='split']) section {
          grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
          gap: calc(var(--gap-card) * 2);
          align-items: start;
        }
      }

      .about {
        display: grid;
        gap: 6px;
        align-content: start;
      }
      .heading {
        margin: 0;
        color: var(--text-body);
        font: var(--font-title-h6);
      }
      :host([danger]) .heading {
        color: var(--color-danger-text);
      }
      .description {
        margin: 0;
        color: var(--text-muted);
        font: var(--font-normal-regular);
        line-height: 1.55;
        text-wrap: pretty;
      }

      .card {
        min-width: 0;
        border: var(--border-width) solid var(--border-subtle);
        border-radius: var(--border-radius-card);
      }
      :host([danger]) .card {
        border-color: var(--color-danger-base);
      }
      .fields {
        display: grid;
        gap: var(--gap-form);
        padding: calc(var(--padding-card) * 1.25);
      }
      .fields.empty {
        display: none;
      }

      .footer {
        display: flex;
        flex-wrap: wrap;
        gap: 12px var(--gap-card);
        align-items: center;
        justify-content: space-between;
        padding: 12px calc(var(--padding-card) * 1.25);
        border-top: var(--border-width) solid var(--border-subtle);
      }
      .fields.empty + .footer {
        border-top: 0;
      }
      .footer.empty {
        display: none;
      }
      .note {
        color: var(--text-muted);
        font: var(--font-normal-small);
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--gap-button);
        margin-inline-start: auto;
      }
    `,
  ];

  @property({ type: String })
  heading = '';

  /** What the section changes, under its heading. */
  @property({ type: String })
  description = '';

  /** `split`: the heading beside the fields, where there is room. `stacked`: over them. */
  @property({ type: String, reflect: true })
  layout: KtSettingsSectionLayout = 'split';

  /** The section that deletes things: its heading and card turn red. */
  @property({ type: Boolean, reflect: true })
  danger = false;

  /** The heading's level. */
  @property({ type: Number, attribute: 'heading-level' })
  headingLevel = 2;

  @state() private filled = new Set<string>();

  private readonly headingId = blockId('kt-settings-section');

  override firstUpdated(): void {
    this.readSlots();
  }

  private readSlots = (): void => {
    const filled = new Set<string>();
    for (const slot of this.shadowRoot?.querySelectorAll('slot') ?? []) {
      if (hasAssignedContent(slot)) filled.add(slot.name);
    }
    this.filled = filled;
  };

  override render(): TemplateResult {
    const footer = this.filled.has('actions') || this.filled.has('note');
    return html`<section
      part="base"
      aria-labelledby=${this.headingId}
      aria-describedby=${this.description ? `${this.headingId}-description` : nothing}
    >
      <div class="about">
        <div id=${this.headingId}>${heading(this.headingLevel, this.heading, 'heading', 2)}</div>
        ${
          this.description
            ? html`<p id=${`${this.headingId}-description`} class="description">
                ${this.description}
              </p>`
            : nothing
        }
      </div>
      <div part="card" class="card">
        <div class=${this.filled.has('') ? 'fields' : 'fields empty'}>
          <slot @slotchange=${this.readSlots}></slot>
        </div>
        <div part="footer" class=${footer ? 'footer' : 'footer empty'}>
          <span class="note"><slot name="note" @slotchange=${this.readSlots}></slot></span>
          <span class="actions"><slot name="actions" @slotchange=${this.readSlots}></slot></span>
        </div>
      </div>
    </section>`;
  }
}

defineElement('kt-settings-section', KtSettingsSection);

declare global {
  interface HTMLElementTagNameMap {
    'kt-settings-section': KtSettingsSection;
  }
}
