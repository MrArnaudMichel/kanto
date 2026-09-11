import { css, html, nothing, type TemplateResult } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { KtElement, defineElement } from 'kanto/internal/kt-element';
import { emit } from 'kanto/internal/events';
import { formatFileSize } from 'kanto/internal/format';
import '../../core/kt-icon/kt-icon.js';
import '../../core/kt-button/kt-button.js';

/**
 * A file drop zone.
 *
 * Accepts a drop or a click, lists what was picked with sizes and types, and
 * lets each entry be removed. It holds the files in memory and reports them —
 * uploading is the application's business.
 *
 * @element kt-drag-drop
 *
 * @csspart base - The dashed drop zone.
 * @csspart list - The list of chosen files.
 *
 * @fires kt-files-change - The selection changed. `detail: { files }`.
 * @fires kt-files-rejected - Files were refused. `detail: { files, reason }`.
 *
 * @example
 * ```html
 * <kt-drag-drop accept="image/*" recommended-size="800×400px"></kt-drag-drop>
 * ```
 */
export class KtDragDrop extends KtElement {
  static override styles = [
    KtElement.styles,
    css`
      :host {
        display: block;
        user-select: none;
      }

      .zone {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--gap-drag-drop);
        padding: var(--padding-drag-drop);
        border: var(--border-width) dashed var(--color-dark-24);
        border-radius: var(--border-radius);
        cursor: pointer;
        transition:
          border-color var(--duration-instant),
          box-shadow var(--duration-instant);
      }

      .zone:hover {
        border-color: var(--text-muted);
      }

      .zone:focus-visible {
        outline: var(--outline-width) solid var(--color-primary-base);
        outline-offset: 2px;
      }

      .dragover {
        border-color: var(--color-primary-base);
        box-shadow: 0 0 0 6px var(--color-primary-soft);
      }

      .prompt {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--gap-button);
        text-align: center;
      }

      .prompt-icon {
        color: var(--text-muted);
      }

      .title {
        margin: 0;
        color: var(--color-primary-base);
        font: var(--font-normal-medium);
      }

      .hint {
        color: var(--text-muted);
        font: var(--font-normal-small);
      }

      input[type='file'] {
        display: none;
      }

      .list {
        display: flex;
        flex-direction: column;
        gap: 8px;
        width: 100%;
        margin: 0;
        padding: 0;
        list-style: none;
      }

      .item {
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;
        padding: 12px;
        background: var(--surface-raised);
        border-radius: var(--border-radius);
        cursor: default;
        transition: background var(--duration-normal) var(--easing-standard);
      }
      .item:hover {
        background: var(--surface-hover);
      }

      .preview {
        display: flex;
        flex: none;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        overflow: hidden;
        color: var(--color-info-base);
        background: var(--color-dark-14);
        border-radius: 6px;
      }

      .info {
        display: flex;
        flex: 1;
        flex-direction: column;
        gap: 4px;
        min-width: 0;
      }

      .name {
        overflow: hidden;
        color: var(--text-body);
        font: var(--font-normal-medium);
        white-space: nowrap;
        text-overflow: ellipsis;
      }

      .details {
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--text-muted);
        font: var(--font-normal-small);
      }
    `,
  ];

  @query('input[type="file"]')
  private fileInput!: HTMLInputElement;

  @state()
  private dragging = false;

  @state()
  private files: File[] = [];

  /**
   * The prompt above the browse link.
   *
   * Named `heading`, not `title`: an element already has a `title`, and
   * reusing it would put the prompt in a native tooltip on the whole zone.
   */
  @property({ type: String })
  heading = 'Drag and drop or';

  /** The clickable-looking part of the prompt. */
  @property({ type: String, attribute: 'link-text' })
  linkText = 'browse your files';

  /** Optional hint, e.g. `800×400px`. */
  @property({ type: String, attribute: 'recommended-size' })
  recommendedSize = '';

  @property({ type: Boolean })
  multiple = true;

  /** Same syntax as the native `accept`: `image/*`, `.pdf,.docx`. */
  @property({ type: String })
  accept = '';

  /** Largest accepted file, in bytes. Zero means no limit. */
  @property({ type: Number, attribute: 'max-size' })
  maxSize = 0;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  /** The files currently held, newest last. */
  get selectedFiles(): readonly File[] {
    return this.files;
  }

  /** Empties the selection without firing a rejection. */
  clear(): void {
    this.files = [];
    emit(this, 'kt-files-change', { files: this.files });
  }

  /**
   * `accept` is advisory on a native input — the OS dialog filters, but a
   * dropped file bypasses it entirely — so the same rules are enforced here.
   */
  private accepts(file: File): boolean {
    if (this.maxSize > 0 && file.size > this.maxSize) return false;
    if (!this.accept) return true;

    return this.accept
      .split(',')
      .map((pattern) => pattern.trim().toLowerCase())
      .filter(Boolean)
      .some((pattern) => {
        if (pattern.startsWith('.')) return file.name.toLowerCase().endsWith(pattern);
        if (pattern.endsWith('/*')) return file.type.startsWith(pattern.slice(0, -1));
        return file.type.toLowerCase() === pattern;
      });
  }

  private addFiles(incoming: FileList | null): void {
    if (!incoming || incoming.length === 0) return;

    const candidates = this.multiple ? [...incoming] : [...incoming].slice(0, 1);
    const accepted = candidates.filter((file) => this.accepts(file));
    const rejected = candidates.filter((file) => !this.accepts(file));

    if (rejected.length > 0) {
      emit(this, 'kt-files-rejected', {
        files: rejected,
        reason: this.maxSize > 0 && rejected.some((f) => f.size > this.maxSize) ? 'size' : 'type',
      });
    }
    if (accepted.length === 0) return;

    this.files = this.multiple ? [...this.files, ...accepted] : accepted;
    emit(this, 'kt-files-change', { files: this.files });
  }

  private removeAt(index: number): void {
    this.files = this.files.filter((_, position) => position !== index);
    emit(this, 'kt-files-change', { files: this.files });
  }

  private browse(): void {
    if (this.disabled) return;
    this.fileInput?.click();
  }

  private onZoneKeyDown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    this.browse();
  }

  private onDragOver(event: DragEvent): void {
    if (this.disabled) return;
    event.preventDefault();
    this.dragging = true;
  }

  private onDrop(event: DragEvent): void {
    if (this.disabled) return;
    event.preventDefault();
    this.dragging = false;
    this.addFiles(event.dataTransfer?.files ?? null);
  }

  override render(): TemplateResult {
    return html`<div
      part="base"
      class=${classMap({ zone: true, dragover: this.dragging })}
      role="button"
      tabindex=${this.disabled ? -1 : 0}
      aria-disabled=${this.disabled ? 'true' : nothing}
      aria-label=${`${this.heading} ${this.linkText}`}
      @click=${this.browse}
      @keydown=${this.onZoneKeyDown}
      @dragover=${this.onDragOver}
      @dragleave=${() => {
        this.dragging = false;
      }}
      @drop=${this.onDrop}
    >
      <input
        type="file"
        ?multiple=${this.multiple}
        accept=${this.accept || nothing}
        @click=${(event: Event) => event.stopPropagation()}
        @change=${(event: Event) => this.addFiles((event.target as HTMLInputElement).files)}
      />

      <div class="prompt">
        <span class="prompt-icon"><kt-icon name="file-up" size="24"></kt-icon></span>
        <div>
          <p class="title">${this.heading} ${this.linkText}</p>
          ${
            this.recommendedSize
              ? html`<div class="hint">Recommended image size: ${this.recommendedSize}</div>`
              : nothing
          }
        </div>
      </div>

      ${
        this.files.length > 0
          ? html`<ul
              part="list"
              class="list"
              aria-label="Selected files"
              @click=${(event: Event) => event.stopPropagation()}
            >
              ${this.files.map(
                (file, index) =>
                  html`<li class="item">
                    <span class="preview"><kt-icon name="file" size="24"></kt-icon></span>
                    <span class="info">
                      <span class="name" title=${file.name}>${file.name}</span>
                      <span class="details">
                        <span>${formatFileSize(file.size)}</span>
                        ${file.type ? html`<span>•</span><span>${file.type}</span>` : nothing}
                      </span>
                    </span>
                    <kt-button
                      variant="danger"
                      size="small"
                      icon="trash-2"
                      label=${`Remove ${file.name}`}
                      @click=${() => this.removeAt(index)}
                    ></kt-button>
                  </li>`,
              )}
            </ul>`
          : nothing
      }
    </div>`;
  }
}

defineElement('kt-drag-drop', KtDragDrop);

declare global {
  interface HTMLElementTagNameMap {
    'kt-drag-drop': KtDragDrop;
  }
}
