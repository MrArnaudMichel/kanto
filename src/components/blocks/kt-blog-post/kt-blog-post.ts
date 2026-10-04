import { css, html, nothing, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { KtElement, defineElement } from '#internal/kt-element';
import { blockId, formatDate } from '#internal/block';
import { heading } from '#internal/heading';
import { hasAssignedContent } from '#internal/slots';
import '../../core/kt-avatar/kt-avatar.js';
import '../../core/kt-icon/kt-icon.js';

/** Every word the post says, in English until given others. */
export interface KtBlogPostTexts {
  readonly back: string;
  readonly minRead: (minutes: number) => string;
}

const TEXTS: KtBlogPostTexts = {
  back: 'All posts',
  minRead: (minutes) => `${minutes} min read`,
};

/** Words a minute, read on a screen. */
const PACE = 230;

/**
 * A post, set to be read: its title, who wrote it and when, a cover, and the
 * body in a measure an eye can follow.
 *
 * The body is the default slot — paragraphs, headings, lists, quotes, code,
 * figures — set as prose. The reading time is counted from it, unless given.
 *
 * @element kt-blog-post
 *
 * @slot - The body.
 * @slot cover - Under the header: an image, a figure with its caption.
 * @slot end - After the body: tags, sharing, the next post.
 *
 * @csspart base - The article.
 * @csspart header - The title, the lead and who wrote it.
 * @csspart body - The body's column.
 *
 * @cssproperty --kt-post-measure - The column's width. 700px.
 *
 * @example
 * ```html
 * <kt-blog-post heading="Closing the month in a day" author="Ada Park" date="2026-09-14" back-href="/blog">
 *   <img slot="cover" src="/covers/close.jpg" alt="" />
 *   <p>For years, the first week of the month was the close…</p>
 * </kt-blog-post>
 * ```
 */
export class KtBlogPost extends KtElement {
  static override styles = [
    KtElement.styles,
    css`
      :host {
        --kt-post-measure: 700px;
        display: block;
        container-type: inline-size;
      }

      article {
        display: grid;
        gap: calc(var(--gap-card) * 2);
        padding-block: var(--kt-block-padding, calc(var(--padding-card) * 2));
      }
      .column {
        width: 100%;
        max-width: var(--kt-post-measure);
        margin-inline: auto;
      }

      header {
        display: grid;
        gap: var(--gap-card);
      }
      .back {
        display: inline-flex;
        gap: 4px;
        align-items: center;
        justify-self: start;
        color: var(--text-muted);
        font: var(--font-normal-regular);
        text-decoration: none;
        border-radius: var(--border-radius);
      }
      .back:hover {
        color: var(--color-primary-text);
      }
      .back:focus-visible {
        outline: var(--outline-width) solid var(--color-primary-base);
        outline-offset: 2px;
      }
      .tags {
        display: flex;
        flex-wrap: wrap;
        gap: 6px 12px;
      }
      .tag {
        color: var(--color-primary-text);
        font: var(--font-normal-small);
      }
      .title {
        margin: 0;
        color: var(--text-body);
        font: 600 clamp(32px, 5cqi, 48px) / 1.1 var(--font-family-display);
        letter-spacing: -0.03em;
        text-wrap: balance;
      }
      .lead {
        margin: 0;
        color: var(--text-muted);
        font: var(--font-normal-regular);
        font-size: calc(19px * var(--text-scale, 1));
        line-height: 1.55;
        text-wrap: pretty;
      }
      .meta {
        display: flex;
        flex-wrap: wrap;
        gap: 8px 16px;
        align-items: center;
        margin-top: 4px;
        color: var(--text-muted);
        font: var(--font-normal-small);
      }
      .author {
        display: flex;
        gap: 10px;
        align-items: center;
      }
      .author-text {
        display: grid;
      }
      .author-name {
        color: var(--text-body);
        font: var(--font-normal-medium);
      }
      .when {
        display: flex;
        flex-wrap: wrap;
        gap: 4px 12px;
      }

      .cover {
        width: 100%;
        max-width: calc(var(--kt-post-measure) + 240px);
        margin-inline: auto;
      }
      .cover ::slotted(img) {
        display: block;
        width: 100%;
        height: auto;
        border-radius: var(--border-radius-card);
      }

      /* The body: the page's own elements, set as prose. */
      .prose {
        color: var(--text-body);
        font: var(--font-normal-regular);
        font-size: calc(17px * var(--text-scale, 1));
        line-height: 1.75;
      }
      .prose ::slotted(*) {
        margin: 0 0 1.25em;
      }
      .prose ::slotted(:last-child) {
        margin-bottom: 0;
      }
      .prose ::slotted(h2) {
        margin: 2em 0 0.6em;
        font: var(--font-title-h4);
        letter-spacing: -0.01em;
      }
      .prose ::slotted(h3) {
        margin: 1.6em 0 0.5em;
        font: var(--font-title-h6);
      }
      .prose ::slotted(ul),
      .prose ::slotted(ol) {
        padding-inline-start: 1.4em;
      }
      .prose ::slotted(blockquote) {
        padding-inline-start: 1em;
        color: var(--text-muted);
        font-style: italic;
        border-inline-start: 3px solid var(--color-primary-base);
      }
      .prose ::slotted(pre) {
        overflow-x: auto;
        padding: var(--padding-card);
        font-size: 14px;
        line-height: 1.6;
        background-color: var(--color-dark-14);
        border-radius: var(--border-radius-card);
      }
      .prose ::slotted(img),
      .prose ::slotted(figure),
      .prose ::slotted(kt-code) {
        display: block;
        max-width: 100%;
        margin-block: 2em;
      }
      .prose ::slotted(hr) {
        margin-block: 2.5em;
        border: 0;
        border-top: var(--border-width) solid var(--border-subtle);
      }

      .end {
        padding-top: calc(var(--gap-card) * 1.5);
        border-top: var(--border-width) solid var(--border-subtle);
      }
      .empty {
        display: none;
      }
    `,
  ];

  /** The post's title. */
  @property({ type: String })
  heading = '';

  /** A line under the title: what the post is about. */
  @property({ type: String })
  lead = '';

  /** When it was published: `2026-09-14`. */
  @property({ type: String })
  date = '';

  /** Who wrote it. */
  @property({ type: String })
  author = '';

  /** Their role: "CFO, Northwind". */
  @property({ type: String, attribute: 'author-role' })
  authorRole = '';

  /** Their photo's URL; without one, their initials. */
  @property({ type: String })
  avatar = '';

  /** Minutes to read it. Counted from the body when 0. */
  @property({ type: Number, attribute: 'reading-time' })
  readingTime = 0;

  /** A few words over the title. */
  @property({ attribute: false })
  tags: readonly string[] = [];

  /** Where All posts leads; no link without it. */
  @property({ type: String, attribute: 'back-href' })
  backHref = '';

  /** The locale the date is written in; the page's language when empty. */
  @property({ type: String })
  locale = '';

  /** The title's level: 1, since the post is the page. */
  @property({ type: Number, attribute: 'heading-level' })
  headingLevel = 1;

  /** The words, English until given others. */
  @property({ attribute: false })
  texts: Partial<KtBlogPostTexts> = {};

  @state() private counted = 0;
  @state() private filled = new Set<string>();

  private readonly headingId = blockId('kt-blog-post');

  override firstUpdated(): void {
    this.readSlots();
  }

  private readSlots = (): void => {
    const filled = new Set<string>();
    for (const slot of this.shadowRoot?.querySelectorAll('slot') ?? []) {
      if (hasAssignedContent(slot)) filled.add(slot.name);
    }
    this.filled = filled;
    const body = this.shadowRoot?.querySelector<HTMLSlotElement>('slot:not([name])');
    const text = (body?.assignedNodes({ flatten: true }) ?? [])
      .map((node) => node.textContent ?? '')
      .join(' ');
    const count = text.split(/\s+/).filter(Boolean).length;
    this.counted = count ? Math.max(1, Math.round(count / PACE)) : 0;
  };

  private meta(): TemplateResult | typeof nothing {
    const t = { ...TEXTS, ...this.texts };
    const minutes = this.readingTime || this.counted;
    if (!this.author && !this.date && !minutes) return nothing;
    return html`<div class="meta">
      ${
        this.author
          ? html`<span class="author">
              <kt-avatar name=${this.author} src=${this.avatar} aria-hidden="true"></kt-avatar>
              <span class="author-text">
                <span class="author-name">${this.author}</span>
                ${this.authorRole ? html`<span class="author-role">${this.authorRole}</span>` : nothing}
              </span>
            </span>`
          : nothing
      }
      <span class="when">
        ${
          this.date
            ? html`<time datetime=${this.date}>${formatDate(this.date, this.locale)}</time>`
            : nothing
        }
        ${minutes ? html`<span class="reading">${t.minRead(minutes)}</span>` : nothing}
      </span>
    </div>`;
  }

  override render(): TemplateResult {
    const t = { ...TEXTS, ...this.texts };
    return html`<article part="base" aria-labelledby=${this.headingId}>
      <header part="header" class="column">
        ${
          this.backHref
            ? html`<a class="back" href=${this.backHref}
                ><kt-icon name="chevron-left" size="16" aria-hidden="true"></kt-icon>${t.back}</a
              >`
            : nothing
        }
        ${
          this.tags.length
            ? html`<div class="tags">
                ${this.tags.map((tag) => html`<span class="tag">${tag}</span>`)}
              </div>`
            : nothing
        }
        <div id=${this.headingId}>${heading(this.headingLevel, this.heading, 'title', 1)}</div>
        ${this.lead ? html`<p class="lead">${this.lead}</p>` : nothing} ${this.meta()}
      </header>
      <div class=${this.filled.has('cover') ? 'cover' : 'cover empty'}>
        <slot name="cover" @slotchange=${this.readSlots}></slot>
      </div>
      <div part="body" class="prose column"><slot @slotchange=${this.readSlots}></slot></div>
      <footer class=${this.filled.has('end') ? 'end column' : 'end column empty'}>
        <slot name="end" @slotchange=${this.readSlots}></slot>
      </footer>
    </article>`;
  }
}

defineElement('kt-blog-post', KtBlogPost);

declare global {
  interface HTMLElementTagNameMap {
    'kt-blog-post': KtBlogPost;
  }
}
