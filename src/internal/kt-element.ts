import { LitElement, css, type CSSResultGroup } from 'lit';

/**
 * Base class for every Kanto element.
 *
 * It exists for two reasons. First, `box-sizing: border-box` does not cross a
 * shadow boundary, so each root has to re-establish it. Second, `[hidden]`
 * loses to a `:host { display: flex }` rule inside the shadow root, and every
 * element in this system sets its own display — without the override here,
 * hiding a Kanto element from the outside silently does nothing.
 */
export class KtElement extends LitElement {
  static override styles: CSSResultGroup = css`
    :host {
      box-sizing: border-box;
    }

    :host([hidden]) {
      display: none !important;
    }

    *,
    *::before,
    *::after {
      box-sizing: inherit;
    }

    /* Read by assistive technology, never drawn. */
    .visually-hidden {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }
  `;
}

/**
 * Registers a custom element, tolerating a repeat call.
 *
 * A design system gets loaded twice more often than you would like — two
 * versions in one dependency tree, a dev-server hot reload, a micro-frontend
 * mounting a second copy. `customElements.define` throws on a duplicate tag
 * and would take the whole page down with it.
 */
export function defineElement(tag: string, ctor: CustomElementConstructor): void {
  if (customElements.get(tag)) return;
  customElements.define(tag, ctor);
}
