import { css, html, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { live } from 'lit/directives/live.js';
import { KtElement, defineElement } from '#internal/kt-element';
import { emit } from '#internal/events';
import { hasAssignedContent } from '#internal/slots';
import { strings } from '#internal/strings';
import '../../core/kt-button/kt-button.js';
import type { KtButton } from '../../core/kt-button/kt-button.js';

export type KtPromptInputSubmitOn = 'enter' | 'mod-enter';

/** What `kt-submit` carries: the text, and a way to have the input wait for its sending. */
export interface KtPromptSubmitDetail {
  readonly value: string;
  /** Hand it the sending: the field holds the text until it resolves, and keeps it if it fails. */
  readonly wait: (sending: Promise<unknown>) => void;
}

/**
 * The field a person writes to an assistant in: it grows with what is
 * written, sends on Enter, and shows the sending on its own send button.
 *
 * Enter sends and Shift+Enter starts a line; with `submit-on="mod-enter"`,
 * Enter starts a line and Cmd or Ctrl+Enter sends. `kt-submit` carries the
 * text and `wait(promise)`: hand it the request, and the send button runs it
 * — its plane turning into the spinner and flying off — while the field holds
 * the text, emptied on success, kept on failure. Without `wait` the field
 * empties at once.
 *
 * @element kt-prompt-input
 *
 * @slot attachments - Above the text: files or context added to the message.
 * @slot actions - Beside the send button: attach, a model picker, a mode.
 *
 * @csspart base - The field.
 * @csspart textarea - The native `<textarea>`.
 * @csspart send - The send button.
 *
 * @fires kt-input - On every keystroke. `detail: { value }`.
 * @fires kt-submit - The text was sent. `detail: { value, wait(promise) }`.
 *
 * @example
 * ```html
 * <kt-prompt-input placeholder="Ask anything"></kt-prompt-input>
 * <script>
 *   prompt.addEventListener('kt-submit', (e) => e.detail.wait(api.ask(e.detail.value)));
 * </script>
 * ```
 */
export class KtPromptInput extends KtElement {
  static override styles = [
    KtElement.styles,
    css`
      :host {
        display: block;
      }

      .field {
        display: grid;
        gap: var(--gap-element);
        padding: var(--gap-element);
        background-color: var(--surface-field);
        border: var(--border-width) solid var(--border-field);
        border-radius: var(--border-radius-card);
        outline: var(--outline-width) solid transparent;
        transition: outline-color var(--duration-instant);
      }
      .field:hover {
        outline: var(--outline-width) solid var(--color-text-700);
      }
      .field:focus-within {
        outline: var(--outline-width) solid var(--color-primary-base);
      }
      .disabled {
        background-color: var(--color-dark-14);
        pointer-events: none;
      }

      .attachments {
        display: flex;
        flex-wrap: wrap;
        gap: var(--gap-button);
      }
      .attachments.empty {
        display: none;
      }

      textarea {
        box-sizing: border-box;
        width: 100%;
        padding: var(--text-area-padding);
        overflow-y: hidden;
        color: var(--text-body);
        font: var(--font-input);
        background: transparent;
        border: none;
        outline: none;
        resize: none;
      }
      textarea::placeholder {
        color: var(--text-muted);
      }
      .disabled textarea {
        color: var(--text-disabled);
      }

      .bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--gap-button);
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--gap-button);
        min-width: 0;
      }
    `,
  ];

  /** The text in the field. */
  @property({ type: String })
  value = '';

  @property({ type: String })
  placeholder = '';

  /** Accessible name for the field. Defaults to the translated "Message". */
  @property({ type: String })
  label = '';

  @property({ type: Boolean, reflect: true })
  disabled = false;

  /** How many lines it grows to before it scrolls. */
  @property({ type: Number, attribute: 'max-rows' })
  maxRows = 8;

  /** `enter` sends on Enter; `mod-enter` on Cmd or Ctrl+Enter, leaving Enter for new lines. */
  @property({ type: String, attribute: 'submit-on' })
  submitOn: KtPromptInputSubmitOn = 'enter';

  @state() private sending = false;
  @state() private hasAttachments = false;

  @query('textarea') private field!: HTMLTextAreaElement;
  @query('kt-button') private button!: KtButton;

  override focus(options?: FocusOptions): void {
    this.field?.focus(options);
  }

  /** Sends what is written, as Enter would. Nothing when it is blank, disabled or sending. */
  submit(): void {
    const value = this.value;
    if (this.disabled || this.sending || !value.trim()) return;
    let sending: Promise<unknown> | null = null;
    emit<KtPromptSubmitDetail>(this, 'kt-submit', {
      value,
      wait: (promise) => {
        sending = promise;
      },
    });
    if (!sending) {
      this.value = '';
      return;
    }
    const waited: Promise<unknown> = sending;
    this.sending = true;
    void this.button
      .run(() => waited)
      .then(
        () => {
          // A newer text typed meanwhile is the reader's, not the sent one.
          if (this.value === value) this.value = '';
        },
        () => undefined,
      )
      .finally(() => {
        this.sending = false;
      });
  }

  override firstUpdated(): void {
    this.readAttachments();
    this.fit();
  }

  override updated(changed: PropertyValues<this>): void {
    if (changed.has('value') || changed.has('maxRows')) this.fit();
  }

  /** As tall as the text, up to `max-rows`; past that it scrolls. */
  private fit(): void {
    const field = this.field;
    if (!field) return;
    const style = getComputedStyle(field);
    const line = parseFloat(style.lineHeight) || 20;
    const padding = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom) || 0;
    const most = line * Math.max(1, this.maxRows) + padding;
    field.style.height = 'auto';
    const wanted = field.scrollHeight;
    field.style.height = `${Math.min(wanted, most)}px`;
    field.style.overflowY = wanted > most ? 'auto' : 'hidden';
  }

  private readAttachments(): void {
    this.hasAttachments = hasAssignedContent(
      this.shadowRoot?.querySelector('slot[name="attachments"]'),
    );
  }

  private onInput(): void {
    this.value = this.field.value;
    emit(this, 'kt-input', { value: this.value });
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' || event.isComposing || event.shiftKey) return;
    const mod = event.metaKey || event.ctrlKey;
    if (this.submitOn === 'mod-enter' && !mod) return;
    event.preventDefault();
    this.submit();
  }

  override render(): TemplateResult {
    const s = strings();
    const blank = !this.value.trim();
    return html`<div part="base" class=${classMap({ field: true, disabled: this.disabled })}>
      <div class=${classMap({ attachments: true, empty: !this.hasAttachments })}>
        <slot name="attachments" @slotchange=${this.readAttachments}></slot>
      </div>
      <textarea
        part="textarea"
        rows="1"
        .value=${live(this.value)}
        placeholder=${this.placeholder || nothing}
        aria-label=${this.label || s.message}
        ?disabled=${this.disabled}
        ?readonly=${this.sending}
        @input=${this.onInput}
        @keydown=${this.onKeyDown}
      ></textarea>
      <div class="bar">
        <div class="actions"><slot name="actions"></slot></div>
        <kt-button
          part="send"
          icon="send"
          size="small"
          label=${s.send}
          ?disabled=${(blank && !this.sending) || this.disabled}
          @click=${() => this.submit()}
        ></kt-button>
      </div>
    </div>`;
  }
}

defineElement('kt-prompt-input', KtPromptInput);

declare global {
  interface HTMLElementTagNameMap {
    'kt-prompt-input': KtPromptInput;
  }
}
