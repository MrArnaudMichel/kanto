import { css, html, nothing, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { KtElement, defineElement } from '#internal/kt-element';
import { strings } from '#internal/strings';
import '../../core/kt-avatar/kt-avatar.js';

export type KtChatMessageFrom = 'assistant' | 'user';

/**
 * One message of a conversation with an assistant.
 *
 * An assistant's reply sits beside its avatar, as text on the page — a reply
 * is often long, and a bubble around paragraphs, lists and code only crowds
 * them. A person's message sits in a bubble on the other side, short and
 * clearly theirs.
 *
 * `thinking` shows three dots, and says so in words, until the reply has a
 * word of its own; `streaming` marks the end of a reply still arriving. Both
 * set `aria-busy`. The content is the default slot: render your markdown into
 * it, as you would anywhere.
 *
 * @element kt-chat-message
 *
 * @slot - The message.
 * @slot avatar - Replaces the avatar drawn from `name` and `avatar`.
 * @slot actions - Under the message: copy, retry, a rating.
 *
 * @csspart base - The `<article>`.
 * @csspart bubble - A person's bubble.
 * @csspart content - The message.
 * @csspart meta - The author and the time.
 *
 * @example
 * ```html
 * <kt-chat-message from="user" name="Dana">What changed this week?</kt-chat-message>
 * <kt-chat-message name="Northwind AI" time="09:41">
 *   <p>Revenue rose 12%, led by three new Team plans.</p>
 *   <kt-button slot="actions" size="small" variant="text" icon="copy">Copy</kt-button>
 * </kt-chat-message>
 * ```
 */
export class KtChatMessage extends KtElement {
  static override styles = [
    KtElement.styles,
    css`
      :host {
        display: block;
      }

      article {
        display: flex;
        gap: var(--gap-form);
        align-items: flex-start;
      }
      :host([from='user']) article {
        justify-content: flex-end;
      }

      .avatar {
        flex: none;
        line-height: 0;
      }

      .body {
        display: grid;
        gap: var(--gap-element);
        min-width: 0;
        max-width: 100%;
      }
      :host([from='user']) .body {
        justify-items: end;
        max-width: min(75%, 560px);
      }

      .meta {
        display: flex;
        gap: var(--gap-button);
        align-items: baseline;
        color: var(--text-muted);
        font: var(--font-normal-small);
      }
      .name {
        color: var(--text-body);
        font: var(--font-normal-medium);
      }

      .content {
        min-width: 0;
        color: var(--text-body);
        font: var(--font-normal-regular);
        line-height: 1.6;
        overflow-wrap: anywhere;
      }
      .content[hidden] {
        display: none;
      }
      .content ::slotted(:first-child) {
        margin-top: 0;
      }
      .content ::slotted(:last-child) {
        margin-bottom: 0;
      }

      .bubble {
        padding: var(--padding-expand) var(--padding-form);
        background: var(--color-primary-soft);
        border-radius: var(--border-radius-card);
        border-end-end-radius: var(--radius-sub-menu);
      }

      /* A reply still arriving: a caret after its last word. */
      .caret {
        display: inline-block;
        width: 0.5em;
        height: 1.1em;
        margin-inline-start: 2px;
        vertical-align: text-bottom;
        background: var(--color-primary-base);
        border-radius: 1px;
        animation: kt-chat-caret calc(var(--duration-slow) * 2.5) steps(1) infinite;
      }
      @keyframes kt-chat-caret {
        50% {
          opacity: 0;
        }
      }

      /* Thinking: three dots, one after another. */
      .dots {
        display: inline-flex;
        gap: 4px;
        align-items: center;
        height: 1.6em;
      }
      .dots i {
        width: 6px;
        height: 6px;
        background: var(--text-muted);
        border-radius: var(--radius-full);
        animation: kt-chat-dot calc(var(--duration-slow) * 3) var(--easing-standard) infinite;
      }
      .dots i:nth-child(2) {
        animation-delay: calc(var(--duration-slow) * 0.5);
      }
      .dots i:nth-child(3) {
        animation-delay: var(--duration-slow);
      }
      @keyframes kt-chat-dot {
        0%,
        60%,
        100% {
          opacity: 0.35;
          translate: 0 0;
        }
        30% {
          opacity: 1;
          translate: 0 -3px;
        }
      }

      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--gap-element);
        color: var(--text-muted);
      }

      .visually-hidden {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
      }
    `,
  ];

  /** Who wrote it: an `assistant`, beside its avatar, or the `user`, in a bubble. */
  @property({ type: String, reflect: true })
  from: KtChatMessageFrom = 'assistant';

  /** The author: names the message, and draws the avatar's initials. */
  @property({ type: String })
  name = '';

  /** A picture for the avatar. */
  @property({ type: String })
  avatar = '';

  /** When it was sent, as shown. */
  @property({ type: String })
  time = '';

  /** The same moment, machine-readable, for the `<time>`. */
  @property({ type: String })
  datetime = '';

  /** Thinking: dots instead of the content, until the reply has a word. */
  @property({ type: Boolean, reflect: true })
  thinking = false;

  /** Still arriving: a caret after the last word. */
  @property({ type: Boolean, reflect: true })
  streaming = false;

  override render(): TemplateResult {
    const user = this.from === 'user';
    const busy = this.thinking || this.streaming;
    const content = html`<div part="content" class="content" ?hidden=${this.thinking}>
      <slot></slot>${
        this.streaming && !this.thinking
          ? html`<span class="caret" aria-hidden="true"></span>`
          : nothing
      }
    </div>`;

    return html`<article
      part="base"
      aria-label=${this.name || nothing}
      aria-busy=${busy ? 'true' : nothing}
    >
      ${
        user
          ? nothing
          : html`<div class="avatar">
              <slot name="avatar"
                ><kt-avatar name=${this.name} src=${this.avatar || nothing} size="small"></kt-avatar
              ></slot>
            </div>`
      }
      <div class="body">
        ${
          this.name || this.time
            ? html`<div part="meta" class="meta">
                ${this.name && !user ? html`<span class="name">${this.name}</span>` : nothing}
                ${
                  this.time
                    ? html`<time datetime=${this.datetime || nothing}>${this.time}</time>`
                    : nothing
                }
              </div>`
            : nothing
        }
        ${
          this.thinking
            ? html`<span class="dots" aria-hidden="true"><i></i><i></i><i></i></span
                ><span class="visually-hidden">${strings().thinking}</span>`
            : nothing
        }
        ${user ? html`<div part="bubble" class="bubble">${content}</div>` : content}
        <div class="actions"><slot name="actions"></slot></div>
      </div>
    </article>`;
  }
}

defineElement('kt-chat-message', KtChatMessage);

declare global {
  interface HTMLElementTagNameMap {
    'kt-chat-message': KtChatMessage;
  }
}
