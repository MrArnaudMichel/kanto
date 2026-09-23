/**
 * Form participation for Kanto's input elements.
 *
 * A control inside a shadow root is invisible to the form around it. The
 * platform's answer is `ElementInternals`: the element declares
 * `static formAssociated = true`, calls `attachInternals()` and pushes its
 * value in with `setFormValue`, which makes it a first-class form control —
 * serialised into `FormData`, reset by `form.reset()`, validated by
 * `form.checkValidity()`.
 *
 * Every browser Kanto targets supports this. Test environments do not: neither
 * happy-dom nor jsdom implements it, and jsdom stubs `attachInternals` with an
 * object that has no `setFormValue`. So each call is guarded, and an element
 * still works — minus form serialisation — where the API is missing.
 */

/** An `ElementInternals` implementation complete enough to be worth calling. */
export type UsableInternals = ElementInternals;

export function attachFormInternals(host: HTMLElement): UsableInternals | null {
  if (typeof host.attachInternals !== 'function') return null;

  const internals = host.attachInternals();
  if (typeof internals.setFormValue !== 'function') return null;

  return internals;
}

/**
 * Pushes the control's current value into the enclosing form, if there is one.
 *
 * A `FormData` submits each of its entries as they are named in it — which is
 * how one control contributes several files under one name.
 */
export function setFormValue(
  internals: UsableInternals | null,
  value: string | FormData | null,
): void {
  internals?.setFormValue(value);
}

/**
 * Mirrors a control's validity onto the host element.
 *
 * `anchor` is the element a browser scrolls to and anchors the native bubble
 * against when the form is submitted invalid.
 */
export function setValidity(
  internals: UsableInternals | null,
  flags: ValidityStateFlags,
  message: string,
  anchor?: HTMLElement,
): void {
  if (!internals || typeof internals.setValidity !== 'function') return;
  if (Object.values(flags).some(Boolean)) internals.setValidity(flags, message, anchor);
  else internals.setValidity({});
}
