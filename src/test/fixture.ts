/**
 * A minimal test fixture for custom elements.
 *
 * Deliberately hand-rolled rather than pulled from @open-wc/testing-helpers:
 * all it needs to do is mount markup, await the element's first render and
 * tear the DOM down again, and owning those thirty lines is cheaper than a
 * dependency that pins its own Lit version.
 */

import { vi, type Mock } from 'vitest';

const mounted: HTMLElement[] = [];

/** True for anything with Lit's async update cycle. */
function isUpdatable(node: unknown): node is { updateComplete: Promise<boolean> } {
  return typeof node === 'object' && node !== null && 'updateComplete' in node;
}

/** Mounts `html` in the document and resolves once the element has rendered. */
export async function fixture<T extends HTMLElement>(html: string): Promise<T> {
  const container = document.createElement('div');
  document.body.append(container);
  mounted.push(container);
  container.innerHTML = html;

  const element = container.firstElementChild;
  if (!element) throw new Error('fixture(): the given markup produced no element');

  if (isUpdatable(element)) await element.updateComplete;
  return element as T;
}

/** Waits for a pending re-render after a property change. */
export async function settle(element: unknown): Promise<void> {
  if (isUpdatable(element)) await element.updateComplete;
}

/** Removes every fixture mounted since the last cleanup. Called from setup.ts. */
export function cleanupFixtures(): void {
  for (const container of mounted.splice(0)) container.remove();
}

/** Resolves with the first event of `name`, or rejects after `timeout` ms. */
export function nextEvent<T = unknown>(
  target: EventTarget,
  name: string,
  timeout = 500,
): Promise<CustomEvent<T>> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      target.removeEventListener(name, handler);
      reject(new Error(`timed out waiting for "${name}"`));
    }, timeout);

    const handler = (event: Event) => {
      clearTimeout(timer);
      resolve(event as CustomEvent<T>);
    };
    target.addEventListener(name, handler, { once: true });
  });
}

/** The two `ElementInternals` calls a Kanto form control makes, as spies. */
export interface FakeInternals {
  setFormValue: Mock;
  setValidity: Mock;
}

/**
 * Mounts `html` like `fixture`, with a fake `ElementInternals` attached.
 *
 * Neither happy-dom nor jsdom implements form association, so without this a
 * test cannot see what an element reports to its form. The fake is installed
 * on the element's class only while it connects — which is when Kanto's
 * controls call `attachInternals` — and removed again straight after.
 */
export async function formFixture<T extends HTMLElement>(
  html: string,
): Promise<{ element: T; internals: FakeInternals }> {
  const tag = /^\s*<([a-z][a-z0-9-]*)/i.exec(html)?.[1];
  const constructor = tag ? customElements.get(tag) : undefined;
  if (!constructor) throw new Error(`formFixture(): <${tag}> is not a defined element`);

  const internals: FakeInternals = { setFormValue: vi.fn(), setValidity: vi.fn() };
  const prototype = constructor.prototype as Partial<HTMLElement>;
  prototype.attachInternals = () => internals as unknown as ElementInternals;
  try {
    return { element: await fixture<T>(html), internals };
  } finally {
    delete prototype.attachInternals;
  }
}
