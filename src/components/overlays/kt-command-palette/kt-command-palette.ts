import { css, html, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { KtElement, defineElement } from '#internal/kt-element';
import { emit, uniqueId } from '#internal/events';
import { closeDialog, isBackdropClick, openModal } from '#internal/dialog';
import { rankCommands, type KtCommand } from '#internal/command-search';
import { strings } from '#internal/strings';
import '../../core/kt-icon/kt-icon.js';
import '../../core/kt-kbd/kt-kbd.js';

export type { KtCommand } from '#internal/command-search';

/** The groups of `commands`, in the order each first appears; ungrouped ones first. */
function grouped(commands: readonly KtCommand[]): { name: string; commands: KtCommand[] }[] {
  const groups = new Map<string, KtCommand[]>();
  for (const command of commands) {
    const name = command.group ?? '';
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name)!.push(command);
  }
  return [...groups].map(([name, list]) => ({ name, commands: list }));
}

/**
 * The palette a product opens on Cmd+K: every action and page, a few
 * keystrokes away.
 *
 * Give it `commands`; it lists them under their groups, narrows them as you
 * type — every word, in any order, in the label, a keyword or the group,
 * ignoring case and accents — and runs the one you pick with `kt-select`.
 * Cmd+K or Ctrl+K opens and closes it from anywhere on the page; `hotkey`
 * changes the key or, empty, turns it off.
 *
 * Built on the native `<dialog>`: the top layer, focus containment and the
 * inert page come from the platform. The field is a combobox over a listbox,
 * so a screen reader follows the active command as the arrows move.
 *
 * @element kt-command-palette
 *
 * @csspart dialog - The `<dialog>`.
 * @csspart input - The search field.
 * @csspart list - The scrolling list.
 * @csspart footer - The keyboard hints.
 *
 * @fires kt-select - A command was run. `detail: { id, command }`.
 * @fires kt-open - It opened.
 * @fires kt-close - It closed.
 *
 * @example
 * ```html
 * <kt-command-palette></kt-command-palette>
 * <script>
 *   palette.commands = [
 *     { id: 'new', label: 'New invoice', group: 'Create', shortcut: 'mod i' },
 *     { id: 'settings', label: 'Open settings', group: 'Navigate', icon: 'settings' },
 *   ];
 *   palette.addEventListener('kt-select', (e) => run(e.detail.id));
 * </script>
 * ```
 */
export class KtCommandPalette extends KtElement {
  static override styles = [
    KtElement.styles,
    css`
      :host {
        display: contents;
      }

      /* Never-opened, a dialog must not keep its box: see kt-modal. */
      dialog {
        display: none;
        flex-direction: column;
        box-sizing: border-box;
        width: 600px;
        max-width: calc(100vw - 32px);
        max-height: min(560px, calc(100vh - 128px));
        margin: 12vh auto auto;
        padding: 0;
        overflow: hidden;
        color: var(--text-body);
        background: var(--surface-popover);
        border: var(--border-width) solid var(--border-popover);
        border-radius: var(--radius-modal);
        box-shadow: var(--shadow-popover);
        opacity: 0;
        transform: scale(0.98);
        transition:
          transform var(--duration-fast) var(--easing-standard),
          opacity var(--duration-fast) var(--easing-standard),
          overlay var(--duration-fast) allow-discrete,
          display var(--duration-fast) allow-discrete;
      }
      dialog[open] {
        display: flex;
        opacity: 1;
        transform: scale(1);
      }
      @starting-style {
        dialog[open] {
          opacity: 0;
          transform: scale(0.98);
        }
      }
      dialog::backdrop {
        background: var(--color-backdrop, rgba(0, 0, 0, 0.45));
      }

      .search {
        display: flex;
        flex: none;
        align-items: center;
        gap: 10px;
        padding: 0 16px;
        color: var(--text-muted);
        border-bottom: var(--border-width) solid var(--divider-popover);
      }
      input {
        flex: 1;
        min-width: 0;
        height: calc(var(--button-height) + 12px);
        padding: 0;
        color: var(--text-body);
        font: var(--font-normal-regular);
        font-size: calc(16px * var(--text-scale, 1));
        background: none;
        border: none;
        outline: none;
      }
      input::placeholder {
        color: var(--text-muted);
      }

      .list {
        flex: 1 1 auto;
        min-height: 0;
        margin: 0;
        padding: 6px;
        overflow: auto;
        scrollbar-width: thin;
      }
      .group + .group {
        margin-top: 6px;
      }
      .heading {
        padding: 8px 10px 4px;
        color: var(--text-muted);
        font: var(--font-normal-small);
      }
      .option {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 10px;
        color: var(--text-body);
        font: var(--font-normal-regular);
        border-radius: var(--radius-input);
        cursor: pointer;
      }
      .option kt-icon {
        flex: none;
        color: var(--text-muted);
      }
      .option .label {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
      .option.active {
        background: var(--color-primary-soft);
      }
      .option.active kt-icon {
        color: var(--color-primary-text);
      }
      .option.disabled {
        color: var(--text-disabled);
        cursor: not-allowed;
      }
      .empty {
        padding: 28px 10px;
        color: var(--text-muted);
        font: var(--font-normal-regular);
        text-align: center;
      }

      .footer {
        display: flex;
        flex: none;
        flex-wrap: wrap;
        gap: 16px;
        padding: 10px 16px;
        color: var(--text-muted);
        font: var(--font-normal-small);
        border-top: var(--border-width) solid var(--divider-popover);
      }
      .footer span {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }

      @media (prefers-reduced-motion: reduce) {
        dialog {
          transition: none;
        }
      }
    `,
  ];

  /** What it can run. Set as a property: `palette.commands = [...]`. */
  @property({ attribute: false })
  commands: readonly KtCommand[] = [];

  @property({ type: Boolean, reflect: true })
  open = false;

  /** Placeholder of the search field. Defaults to the translated string. */
  @property({ type: String })
  placeholder = '';

  /**
   * The key that opens it with Cmd or Ctrl, from anywhere on the page. Empty
   * turns the shortcut off — for a page with two palettes, or its own key.
   */
  @property({ type: String })
  hotkey = 'k';

  @state() private query = '';
  @state() private activeIndex = 0;

  @query('dialog') private dialog!: HTMLDialogElement;
  @query('input') private input!: HTMLInputElement;

  private readonly listId = uniqueId('kt-command-list');
  /** Where the focus was before opening, to give it back on close. */
  private returnFocus: HTMLElement | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener('keydown', this.onDocumentKeyDown);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this.onDocumentKeyDown);
  }

  /** The commands the query keeps, best first. */
  private get results(): KtCommand[] {
    return rankCommands(this.commands, this.query);
  }

  override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has('open') && this.open) {
      this.query = '';
      this.activeIndex = this.firstEnabled(this.results);
    }
    if (changed.has('commands')) this.activeIndex = this.firstEnabled(this.results);
  }

  override updated(changed: PropertyValues<this>): void {
    if (!changed.has('open')) return;
    if (this.open) {
      this.returnFocus = deepActiveElement();
      openModal(this.dialog);
      this.input.value = '';
      this.input.focus();
      emit(this, 'kt-open');
    } else if (changed.get('open') === true) {
      closeDialog(this.dialog);
      this.returnFocus?.focus?.();
      this.returnFocus = null;
      emit(this, 'kt-close');
    }
  }

  private firstEnabled(list: readonly KtCommand[]): number {
    return list.findIndex((command) => !command.disabled);
  }

  /** The next enabled command from `from`, one way, wrapping; -1 when none is. */
  private step(list: readonly KtCommand[], from: number, by: 1 | -1): number {
    for (let i = 1; i <= list.length; i += 1) {
      const index = (from + by * i + list.length * i) % list.length;
      if (!list[index]!.disabled) return index;
    }
    return -1;
  }

  private onDocumentKeyDown = (event: KeyboardEvent): void => {
    if (!this.hotkey || event.key.toLowerCase() !== this.hotkey.toLowerCase()) return;
    if (!(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey) return;
    event.preventDefault();
    this.open = !this.open;
  };

  private onInput(): void {
    this.query = this.input.value;
    this.activeIndex = this.firstEnabled(this.results);
  }

  private onKeyDown(event: KeyboardEvent): void {
    const list = this.results;
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp':
        event.preventDefault();
        if (list.length)
          this.activeIndex = this.step(list, this.activeIndex, event.key === 'ArrowDown' ? 1 : -1);
        break;
      case 'Home':
      case 'End':
        if (!list.length) return;
        event.preventDefault();
        this.activeIndex = event.key === 'Home' ? this.firstEnabled(list) : this.step(list, 0, -1);
        break;
      case 'Enter': {
        event.preventDefault();
        const command = list[this.activeIndex];
        if (command) this.run(command);
        break;
      }
      case 'Escape':
        event.preventDefault();
        this.open = false;
        break;
    }
  }

  private run(command: KtCommand): void {
    if (command.disabled) return;
    this.open = false;
    emit(this, 'kt-select', { id: command.id, command });
  }

  private onDialogCancel(event: Event): void {
    // Escape is handled on the field; this catches it anywhere else.
    event.preventDefault();
    this.open = false;
  }

  private onDialogClick(event: MouseEvent): void {
    if (isBackdropClick(this.dialog, event)) this.open = false;
  }

  private optionId(index: number): string {
    return `${this.listId}-${index}`;
  }

  override render(): TemplateResult {
    const s = strings();
    const list = this.results;
    const active = list[this.activeIndex];
    let index = -1;

    return html`<dialog
      part="dialog"
      aria-label=${s.commandPalette}
      @cancel=${this.onDialogCancel}
      @click=${this.onDialogClick}
    >
      <div class="search">
        <kt-icon name="search" size="18"></kt-icon>
        <input
          part="input"
          type="text"
          role="combobox"
          aria-expanded="true"
          aria-controls=${this.listId}
          aria-autocomplete="list"
          aria-activedescendant=${active ? this.optionId(this.activeIndex) : nothing}
          aria-label=${s.commandPalette}
          placeholder=${this.placeholder || s.commandPlaceholder}
          autocomplete="off"
          spellcheck="false"
          @input=${this.onInput}
          @keydown=${this.onKeyDown}
        />
      </div>

      <div part="list" class="list" id=${this.listId} role="listbox" aria-label=${s.commandPalette}>
        ${
          list.length === 0
            ? html`<div class="empty" role="presentation">${s.noResults}</div>`
            : grouped(list).map(
                (group) =>
                  html`<div class="group" role="group" aria-label=${group.name || s.commandPalette}>
                    ${group.name ? html`<div class="heading" aria-hidden="true">${group.name}</div>` : nothing}
                    ${group.commands.map((command) => {
                      index += 1;
                      const at = index;
                      return html`<div
                        id=${this.optionId(at)}
                        class=${classMap({
                          option: true,
                          active: at === this.activeIndex,
                          disabled: Boolean(command.disabled),
                        })}
                        role="option"
                        aria-selected=${at === this.activeIndex ? 'true' : 'false'}
                        aria-disabled=${command.disabled ? 'true' : nothing}
                        @pointermove=${() => {
                          if (!command.disabled && this.activeIndex !== at) this.activeIndex = at;
                        }}
                        @click=${() => this.run(command)}
                      >
                        ${command.icon ? html`<kt-icon name=${command.icon} size="16"></kt-icon>` : nothing}
                        <span class="label">${command.label}</span>
                        ${command.shortcut ? html`<kt-kbd keys=${command.shortcut}></kt-kbd>` : nothing}
                      </div>`;
                    })}
                  </div>`,
              )
        }
      </div>

      <div part="footer" class="footer" aria-hidden="true">
        <span><kt-kbd>↑</kt-kbd><kt-kbd>↓</kt-kbd>${s.commandHintMove}</span>
        <span><kt-kbd>↵</kt-kbd>${s.commandHintRun}</span>
        <span><kt-kbd>esc</kt-kbd>${s.commandHintClose}</span>
      </div>
    </dialog>`;
  }
}

/** The focused element, through open shadow roots. */
function deepActiveElement(): HTMLElement | null {
  let active = document.activeElement;
  while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
  return active instanceof HTMLElement ? active : null;
}

defineElement('kt-command-palette', KtCommandPalette);

declare global {
  interface HTMLElementTagNameMap {
    'kt-command-palette': KtCommandPalette;
  }
}
