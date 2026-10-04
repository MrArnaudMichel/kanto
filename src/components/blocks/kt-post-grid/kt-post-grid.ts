import { css, html, nothing, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { KtElement, defineElement } from '#internal/kt-element';
import { blockHead, blockId, blockStyles, formatDate } from '#internal/block';
import { heading } from '#internal/heading';
import { hasAssignedContent } from '#internal/slots';
import '../../core/kt-avatar/kt-avatar.js';

export interface KtPost {
  readonly title: string;
  readonly href: string;
  readonly excerpt?: string;
  /** When it was published: `2026-09-14`. */
  readonly date?: string;
  /** A cover image's URL. */
  readonly image?: string;
  /** The cover's text alternative; empty when the title says it all. */
  readonly imageAlt?: string;
  readonly author?: { readonly name: string; readonly avatar?: string };
  readonly tags?: readonly string[];
}

export type KtPostGridLayout = 'grid' | 'list';

/**
 * The latest posts, each a card that leads to it: a cover, a title, a line,
 * and who wrote it when.
 *
 * The posts are data: `grid.posts = [{ title, href, excerpt, date, image,
 * author, tags }]`. `grid`, the default, sets them in `columns` where there is
 * room; `list` puts one under another, the cover beside the words.
 *
 * @element kt-post-grid
 *
 * @slot more - Under the posts: a link to every one.
 *
 * @csspart base - The section.
 * @csspart post - One post.
 *
 * @example
 * ```html
 * <kt-post-grid heading="From the blog">
 *   <a slot="more" href="/blog">Every post</a>
 * </kt-post-grid>
 * <script>
 *   grid.posts = [{ title: 'Closing the month in a day', href: '/blog/close', date: '2026-09-14' }];
 * </script>
 * ```
 */
export class KtPostGrid extends KtElement {
  static override styles = [
    KtElement.styles,
    blockStyles,
    css`
      :host {
        --kt-post-columns: 3;
      }
      :host([columns='2']) {
        --kt-post-columns: 2;
      }

      .posts {
        display: grid;
        grid-template-columns: repeat(var(--kt-post-columns), minmax(0, 1fr));
        gap: calc(var(--gap-card) * 1.5);
        margin: 0;
        padding: 0;
        list-style: none;
      }
      @container (max-width: 760px) {
        .posts {
          grid-template-columns: repeat(min(2, var(--kt-post-columns)), minmax(0, 1fr));
        }
      }
      @container (max-width: 520px) {
        .posts {
          grid-template-columns: minmax(0, 1fr);
        }
      }
      :host([layout='list']) .posts {
        grid-template-columns: minmax(0, 1fr);
      }

      article {
        position: relative;
        display: grid;
        grid-template-rows: auto 1fr;
        height: 100%;
        overflow: hidden;
        text-align: start;
        border: var(--border-width) solid var(--border-subtle);
        border-radius: var(--border-radius-card);
        transition: border-color var(--duration-instant);
      }
      article:hover {
        border-color: var(--color-primary-base);
      }
      article:has(a:focus-visible) {
        outline: var(--outline-width) solid var(--color-primary-base);
        outline-offset: 2px;
      }

      .cover {
        display: block;
        width: 100%;
        aspect-ratio: 16 / 9;
        object-fit: cover;
        background-color: var(--color-dark-14);
      }

      .body {
        display: grid;
        align-content: start;
        gap: 10px;
        padding: var(--padding-card);
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
        font: var(--font-title-h6);
        text-wrap: balance;
      }
      .title a {
        color: inherit;
        text-decoration: none;
      }
      .title a:focus-visible {
        outline: none;
      }
      /* The whole card answers the link. */
      .title a::after {
        position: absolute;
        inset: 0;
        content: '';
      }
      .excerpt {
        margin: 0;
        color: var(--text-muted);
        font: var(--font-normal-regular);
        line-height: 1.6;
        text-wrap: pretty;
      }
      .meta {
        display: flex;
        flex-wrap: wrap;
        gap: 4px 12px;
        align-items: center;
        margin-top: 4px;
        color: var(--text-muted);
        font: var(--font-normal-small);
      }
      .author {
        display: inline-flex;
        gap: 8px;
        align-items: center;
        color: var(--text-body);
      }

      /* List: the cover beside the words, where there is room. */
      @container (min-width: 640px) {
        :host([layout='list']) article {
          grid-template-columns: minmax(200px, 2fr) 3fr;
          grid-template-rows: none;
        }
        :host([layout='list']) .cover {
          height: 100%;
          aspect-ratio: auto;
          min-height: 180px;
        }
      }

      .more {
        display: flex;
        justify-content: center;
        font: var(--font-normal-regular);
      }
      :host([align='start']) .more {
        justify-content: flex-start;
      }
      .more.empty {
        display: none;
      }
    `,
  ];

  @property({ type: String })
  heading = '';

  @property({ type: String })
  lead = '';

  /** `center` or `start`: the head and the more link. */
  @property({ type: String, reflect: true })
  align: 'center' | 'start' = 'center';

  /** The posts, newest first. */
  @property({ attribute: false })
  posts: readonly KtPost[] = [];

  /** Posts per row, where there is room: 2 or 3. */
  @property({ type: Number, reflect: true })
  columns: 2 | 3 = 3;

  /** `grid`: in columns. `list`: one under another, the cover beside the words. */
  @property({ type: String, reflect: true })
  layout: KtPostGridLayout = 'grid';

  /** The locale dates are written in; the page's language when empty. */
  @property({ type: String })
  locale = '';

  /** The heading's level; the posts' titles sit one under. */
  @property({ type: Number, attribute: 'heading-level' })
  headingLevel = 2;

  @state() private hasMore = false;

  private readonly headingId = blockId('kt-post-grid');

  override firstUpdated(): void {
    this.readMore();
  }

  private readMore(): void {
    this.hasMore = hasAssignedContent(this.shadowRoot?.querySelector('slot[name="more"]'));
  }

  private post(post: KtPost): TemplateResult {
    const title = html`<a href=${post.href}>${post.title}</a>`;
    return html`<li>
      <article part="post">
        ${
          post.image
            ? html`<img
                class="cover"
                src=${post.image}
                alt=${post.imageAlt ?? ''}
                loading="lazy"
              />`
            : nothing
        }
        <div class="body">
          ${
            post.tags?.length
              ? html`<div class="tags">
                  ${post.tags.map((tag) => html`<span class="tag">${tag}</span>`)}
                </div>`
              : nothing
          }
          ${heading(this.headingLevel + 1, title, 'title', 3)}
          ${post.excerpt ? html`<p class="excerpt">${post.excerpt}</p>` : nothing}
          ${
            post.author || post.date
              ? html`<div class="meta">
                  ${
                    post.author
                      ? html`<span class="author"
                          ><kt-avatar
                            name=${post.author.name}
                            src=${post.author.avatar ?? ''}
                            size="small"
                            aria-hidden="true"
                          ></kt-avatar
                          >${post.author.name}</span
                        >`
                      : nothing
                  }
                  ${
                    post.date
                      ? html`<time datetime=${post.date}
                          >${formatDate(post.date, this.locale)}</time
                        >`
                      : nothing
                  }
                </div>`
              : nothing
          }
        </div>
      </article>
    </li>`;
  }

  override render(): TemplateResult {
    return html`<section
      part="base"
      class="block"
      aria-labelledby=${this.heading ? this.headingId : nothing}
    >
      ${blockHead({ title: this.heading, lead: this.lead, level: this.headingLevel, id: this.headingId })}
      <ul class="posts" role="list">
        ${this.posts.map((post) => this.post(post))}
      </ul>
      <div class=${this.hasMore ? 'more' : 'more empty'}>
        <slot name="more" @slotchange=${this.readMore}></slot>
      </div>
    </section>`;
  }
}

defineElement('kt-post-grid', KtPostGrid);

declare global {
  interface HTMLElementTagNameMap {
    'kt-post-grid': KtPostGrid;
  }
}
