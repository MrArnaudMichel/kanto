import { css, html, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import { styleMap } from 'lit/directives/style-map.js';
import { KtElement, defineElement } from '#internal/kt-element';
import { emit } from '#internal/events';
import { attachFormInternals, setFormValue, type UsableInternals } from '#internal/form-control';
import { strings } from '#internal/strings';
import { KT_ACCENTS } from '../../../theme/accent.js';
import '../../core/kt-icon/kt-icon.js';

export interface KtColorSwatch {
  /** A hex colour: `#1f6feb`. */
  readonly value: string;
  /** Its name, said for the swatch: "Blue". Defaults to the hex code. */
  readonly label?: string;
}

const HEX = /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i;

/** A hex colour in its one spelling — `#rrggbb`, lower case — or null when it is not one. */
function normalise(text: string): string | null {
  const match = HEX.exec(text.trim());
  if (!match) return null;
  const digits = match[1]!.toLowerCase();
  const full = digits.length === 3 ? [...digits].map((d) => d + d).join('') : digits;
  return `#${full}`;
}

/**
 * A colour, chosen from swatches or set freely: a label's colour, a theme's
 * accent, a chart series.
 *
 * The swatches are a radio group — the arrows move and pick, wrapping — Kanto's
 * accents until `swatches` gives others. Beside them, the free colour: the
 * system's own picker behind a swatch, and a hex field that takes a colour
 * once it is a whole one. `no-custom` keeps to the swatches.
 *
 * A form control, submitted as `#rrggbb` under `name`.
 *
 * @element kt-color-picker
 *
 * @csspart swatches - The radio group.
 * @csspart swatch - One swatch.
 * @csspart custom - The free colour's swatch.
 * @csspart hex - The hex field.
 *
 * @fires kt-change - The colour changed. `detail: { value }`.
 *
 * @example
 * ```html
 * <kt-color-picker label="Label colour" name="colour" value="#1f6feb"></kt-color-picker>
 * ```
 */
export class KtColorPicker extends KtElement {
  static readonly formAssociated = true;

  static override styles = [
    KtElement.styles,
    css`
      :host {
        display: inline-block;
        --kt-swatch-size: 24px;
      }

      .picker {
        display: flex;
        flex-wrap: wrap;
        gap: var(--gap-form);
        align-items: center;
      }

      .swatches {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .swatch {
        position: relative;
        display: inline-grid;
        flex: none;
        place-items: center;
        width: var(--kt-swatch-size);
        height: var(--kt-swatch-size);
        padding: 0;
        color: var(--text-muted);
        background: var(--swatch, var(--surface-field));
        border: var(--border-width) solid var(--border-subtle);
        border-radius: var(--radius-full);
        cursor: pointer;
        transition: box-shadow var(--duration-fast) var(--easing-standard);
      }
      /* Chosen: a ring in its own colour, set off by the page's. */
      .swatch[aria-checked='true'],
      .swatch[data-chosen] {
        box-shadow:
          0 0 0 2px var(--surface-page),
          0 0 0 4px var(--swatch, var(--color-primary-base));
      }
      .swatch:focus-visible {
        outline: var(--outline-width) solid var(--color-primary-base);
        outline-offset: 5px;
      }
      :host([disabled]) .swatch {
        cursor: not-allowed;
        opacity: 0.5;
      }

      /* The system picker, invisible over the swatch that stands for it. */
      .custom input {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        opacity: 0;
        cursor: inherit;
      }

      .hex {
        box-sizing: border-box;
        width: 96px;
        height: var(--button-height-small);
        padding: 0 10px;
        color: var(--text-body);
        font: var(--font-code-regular);
        text-transform: lowercase;
        background: var(--surface-field);
        border: var(--border-width) solid var(--border-field);
        border-radius: var(--radius-input);
        outline: var(--outline-width) solid transparent;
        transition: outline-color var(--duration-instant);
      }
      .hex:focus {
        outline-color: var(--color-primary-base);
      }
    `,
  ];

  /** The colour, as `#rrggbb`. */
  @property({ type: String })
  value = '';

  /** The preset colours. Kanto's accents until given others. */
  @property({ attribute: false })
  swatches: readonly KtColorSwatch[] = KT_ACCENTS.map((accent) => ({
    value: accent.color,
    label: accent.label,
  }));

  /** Accessible name for the swatches: "Label colour". */
  @property({ type: String })
  label = '';

  @property({ type: String })
  name = '';

  @property({ type: Boolean, reflect: true })
  disabled = false;

  /** Keeps to the swatches: no system picker, no hex field. */
  @property({ type: Boolean, attribute: 'no-custom' })
  noCustom = false;

  @state() private formDisabled = false;

  private internals: UsableInternals | null = null;
  private defaultValue = '';

  override connectedCallback(): void {
    super.connectedCallback();
    this.internals ??= attachFormInternals(this);
    this.value = normalise(this.value) ?? '';
    this.defaultValue = this.value;
  }

  override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has('value')) {
      const value = normalise(this.value) ?? '';
      if (value !== this.value) this.value = value;
      setFormValue(this.internals, this.value || null);
    }
  }

  formResetCallback(): void {
    this.value = this.defaultValue;
  }

  formDisabledCallback(disabled: boolean): void {
    this.formDisabled = disabled;
  }

  formStateRestoreCallback(state: string | null): void {
    this.value = state ?? '';
  }

  private get inactive(): boolean {
    return this.disabled || this.formDisabled;
  }

  private get presets(): KtColorSwatch[] {
    return this.swatches.flatMap((swatch) => {
      const value = normalise(swatch.value);
      if (!value) return [];
      return swatch.label === undefined ? [{ value }] : [{ value, label: swatch.label }];
    });
  }

  private pick(value: string | null): void {
    if (!value || value === this.value || this.inactive) return;
    this.value = value;
    emit(this, 'kt-change', { value });
  }

  private onKeyDown(event: KeyboardEvent, index: number): void {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (step === undefined) return;
    event.preventDefault();
    const presets = this.presets;
    const next = presets[(index + step + presets.length) % presets.length]!;
    this.pick(next.value);
    void this.updateComplete.then(() =>
      this.shadowRoot
        ?.querySelectorAll<HTMLElement>('[role="radio"]')
        [presets.indexOf(next)]?.focus(),
    );
  }

  override render(): TemplateResult {
    const s = strings();
    const presets = this.presets;
    const chosen = presets.findIndex((swatch) => swatch.value === this.value);
    const custom = chosen === -1 && Boolean(this.value);
    return html`<div class="picker">
      <div
        part="swatches"
        class="swatches"
        role="radiogroup"
        aria-label=${this.label || nothing}
        aria-disabled=${this.inactive ? 'true' : nothing}
      >
        ${presets.map(
          (swatch, index) =>
            html`<button
              part="swatch"
              class="swatch"
              type="button"
              role="radio"
              aria-label=${swatch.label ?? swatch.value}
              aria-checked=${index === chosen ? 'true' : 'false'}
              tabindex=${index === (chosen === -1 ? 0 : chosen) ? 0 : -1}
              ?disabled=${this.inactive}
              style=${styleMap({ '--swatch': swatch.value })}
              @click=${() => this.pick(swatch.value)}
              @keydown=${(event: KeyboardEvent) => this.onKeyDown(event, index)}
            ></button>`,
        )}
      </div>
      ${
        this.noCustom
          ? nothing
          : html`<label
                part="custom"
                class="swatch custom"
                ?data-chosen=${custom}
                style=${styleMap({ '--swatch': custom ? this.value : undefined })}
              >
                ${custom ? nothing : html`<kt-icon name="plus" size="14"></kt-icon>`}
                <input
                  type="color"
                  aria-label=${s.customColour}
                  .value=${live(this.value || presets[0]?.value || '#000000')}
                  ?disabled=${this.inactive}
                  @input=${(event: Event) => this.pick(normalise((event.target as HTMLInputElement).value))}
                />
              </label>
              <input
                part="hex"
                class="hex"
                type="text"
                inputmode="text"
                spellcheck="false"
                autocomplete="off"
                maxlength="7"
                aria-label=${s.hexColour}
                .value=${live(this.value)}
                ?disabled=${this.inactive}
                @input=${(event: Event) => this.pick(normalise((event.target as HTMLInputElement).value))}
              />`
      }
    </div>`;
  }
}

defineElement('kt-color-picker', KtColorPicker);

declare global {
  interface HTMLElementTagNameMap {
    'kt-color-picker': KtColorPicker;
  }
}
