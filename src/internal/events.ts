/**
 * Dispatches a `CustomEvent` from a Kanto element.
 *
 * Kanto events cross shadow boundaries (`composed`) and bubble, so a consumer
 * can listen on a container rather than on every element — the behaviour a
 * React or Vue developer expects from an `onChange` prop. They are cancelable
 * so a host can `preventDefault()` a change it wants to veto.
 */
export function emit<T>(host: HTMLElement, name: string, detail?: T): CustomEvent<T> {
  const event = new CustomEvent<T>(name, {
    detail: detail as T,
    bubbles: true,
    composed: true,
    cancelable: true,
  });
  host.dispatchEvent(event);
  return event;
}

let counter = 0;

/**
 * Generates a document-unique id, for wiring `aria-labelledby` and friends
 * across a shadow root.
 */
export function uniqueId(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter}`;
}
