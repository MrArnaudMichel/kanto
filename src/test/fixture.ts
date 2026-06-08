/**
 * A minimal test fixture for custom elements.
 *
 * Deliberately hand-rolled rather than pulled from @open-wc/testing-helpers:
 * all it needs to do is mount markup, await the element's first render and
 * tear the DOM down again, and owning those thirty lines is cheaper than a
 * dependency that pins its own Lit version.
 */

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
