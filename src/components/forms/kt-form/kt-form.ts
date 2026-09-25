import { css, html, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { property, queryAssignedElements, state } from 'lit/decorators.js';
import { KtElement, defineElement } from '#internal/kt-element';
import { hasAssignedContent } from '#internal/slots';
import { strings } from '#internal/strings';
import '../../feedback/kt-skeleton/kt-skeleton.js';

/** Anything the panel can switch off along with itself. */
interface Disableable extends HTMLElement {
  disabled?: boolean;
}

/**
 * A panel grouping related fields.
 *
 * It sits one step above the page on `--surface-form`, so the fields inside —
 * filled at `--surface-field` — read as wells recessed into it rather than as
 * boxes floating on it.
 *
 * **Put it inside your own `<form>`.** It renders a `<fieldset>`, not a form:
 * Kanto fields are form-associated custom elements, and a control finds its
 * form by walking its *own* tree. A `<form>` inside this element's shadow root
 * would not own anything slotted into it, and `new FormData(form)` would come
 * back empty. The `<form>` above stays in charge of submission, validation and
 * reset; this owns the grouping and the look.
 *
 * @element kt-form
 *
 * @slot - The fields.
 * @slot heading - Replaces the `heading` attribute, for markup.
 * @slot footer - Actions, right-aligned. Hidden when empty.
 *
 * @csspart base - The `<fieldset>`.
 * @csspart header - The heading and description.
 * @csspart fields - The field column.
 * @csspart footer - The action row.
 *
 * @example
 * ```html
 * <form>
 *   <kt-form heading="Identity" description="How we address you.">
 *     <kt-label-input label="Company" required>
 *       <kt-input name="company" required></kt-input>
 *     </kt-label-input>
 *     <kt-button slot="footer" type="submit">Save</kt-button>
 *   </kt-form>
 * </form>
 * ```
 */
export class KtForm extends KtElement {
  static override styles = [
    KtElement.styles,
    css`
      :host {
        display: block;
      }

      fieldset {
        display: flex;
        flex-direction: column;
        gap: var(--gap-form);
        min-width: 0;
        margin: 0;
        padding: var(--padding-card);
        background-color: var(--surface-form);
        border: var(--border-width) solid var(--border-subtle);
        border-radius: var(--border-radius-card);
      }

      .header {
        display: flex;
        flex-direction: column;
        gap: var(--gap-element);
      }

      /* A legend is the accessible name for the group, so it stays in the
         accessibility tree even when there is nothing to show. */
      legend {
        padding: 0;
        color: var(--text-body);
        font: var(--font-title-h6);
      }

      legend.visually-hidden {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
      }

      .description {
        margin: 0;
        color: var(--text-muted);
        font: var(--font-normal-regular);
      }

      .fields {
        display: flex;
        flex-direction: column;
        gap: var(--gap-form);
        min-width: 0;
      }

      .placeholder {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .footer {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: flex-end;
        gap: var(--gap-button);
      }

      /* Collapsed from JS: a wrapper around a <slot> always has the slot as a
         child, so :has(*) cannot tell an empty slot from a filled one. */
      .footer.empty {
        display: none;
      }

      /* While loading, the real fields stay in the DOM — and keep their state
         — but step aside for the placeholders. */
      :host([loading]) ::slotted(*) {
        display: none;
      }

      :host([disabled]) fieldset {
        opacity: 0.6;
      }
    `,
  ];

  @queryAssignedElements()
  private fields!: HTMLElement[];

  @state()
  private hasFooter = false;

  /** Group heading. Also the fieldset's accessible name. */
  @property({ type: String })
  heading = '';

  @property({ type: String })
  description = '';

  /** Replaces the fields with placeholders. */
  @property({ type: Boolean, reflect: true })
  loading = false;

  /** Switches off every field in the panel. */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /** How many placeholder fields `loading` draws. */
  @property({ type: Number, attribute: 'loading-fields' })
  loadingFields = 3;

  override updated(changed: PropertyValues<this>): void {
    if (changed.has('disabled')) this.syncDisabled();
  }

  /**
   * A native `<fieldset disabled>` switches off its descendants, but slotted
   * fields are not descendants of the fieldset in their own tree — the shadow
   * boundary sits between them — so the platform never reaches them. Walk the
   * slotted controls and set it directly.
   */
  /**
   * The initial `slotchange` is queued as a microtask and can land after the
   * first render has settled, so read the slots once directly as well.
   */
  override firstUpdated(): void {
    this.readSlots();
    this.syncDisabled();
  }

  private readSlots(): void {
    this.hasFooter = hasAssignedContent(
      this.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="footer"]'),
    );
  }

  private onFooterSlotChange(): void {
    this.readSlots();
  }

  private syncDisabled(): void {
    for (const field of this.fields ?? []) {
      if ('disabled' in field) (field as Disableable).disabled = this.disabled;
      for (const nested of field.querySelectorAll<Disableable>('*')) {
        if ('disabled' in nested) nested.disabled = this.disabled;
      }
    }
  }

  override render(): TemplateResult {
    const hasHeader = Boolean(this.heading) || Boolean(this.description);

    return html`<fieldset part="base" ?disabled=${this.disabled}>
      <legend class=${this.heading ? '' : 'visually-hidden'}>
        <slot name="heading">${this.heading || strings().formSection}</slot>
      </legend>

      ${
        hasHeader && this.description
          ? html`<div part="header" class="header">
              <p class="description">${this.description}</p>
            </div>`
          : nothing
      }

      <div part="fields" class="fields">
        ${
          this.loading
            ? Array.from(
                { length: this.loadingFields },
                () =>
                  html`<div class="placeholder" aria-hidden="true">
                    <kt-skeleton width="30%" height="14px"></kt-skeleton>
                    <kt-skeleton variant="rect" height="40px"></kt-skeleton>
                  </div>`,
              )
            : nothing
        }
        <slot @slotchange=${this.syncDisabled}></slot>
      </div>

      <div part="footer" class=${this.hasFooter ? 'footer' : 'footer empty'}>
        <slot name="footer" @slotchange=${this.onFooterSlotChange}></slot>
      </div>
    </fieldset>`;
  }
}

defineElement('kt-form', KtForm);

declare global {
  interface HTMLElementTagNameMap {
    'kt-form': KtForm;
  }
}
