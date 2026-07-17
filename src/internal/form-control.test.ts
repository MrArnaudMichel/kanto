import { describe, expect, it, vi } from 'vitest';
import { attachFormInternals, setFormValue, setValidity } from './form-control.js';

/** An element with whichever slice of ElementInternals we want to simulate. */
function hostWith(internals: Partial<ElementInternals> | null): HTMLElement {
  const element = document.createElement('div');
  if (internals === null) {
    // @ts-expect-error deliberately removing the API, as a test DOM would
    element.attachInternals = undefined;
  } else {
    element.attachInternals = () => internals as ElementInternals;
  }
  return element;
}

describe('attachFormInternals', () => {
  it('returns the internals when the platform supports them', () => {
    const internals = { setFormValue: vi.fn() };
    expect(attachFormInternals(hostWith(internals))).toBe(internals);
  });

  it('returns null where attachInternals is missing', () => {
    expect(attachFormInternals(hostWith(null))).toBeNull();
  });

  it('returns null for the half-implementation jsdom provides', () => {
    // jsdom stubs attachInternals with an object that has no setFormValue;
    // treating that as usable is what makes the unguarded version pass
    // locally and die in CI.
    expect(attachFormInternals(hostWith({}))).toBeNull();
  });
});

describe('setFormValue', () => {
  it('forwards the value', () => {
    const internals = { setFormValue: vi.fn() } as unknown as ElementInternals;
    setFormValue(internals, 'kanto');
    expect(internals.setFormValue).toHaveBeenCalledWith('kanto');
  });

  it('is a no-op without internals', () => {
    expect(() => setFormValue(null, 'kanto')).not.toThrow();
  });
});

describe('setValidity', () => {
  it('reports a flag with its message', () => {
    const internals = {
      setFormValue: vi.fn(),
      setValidity: vi.fn(),
    } as unknown as ElementInternals;
    setValidity(internals, { valueMissing: true }, 'Ce champ est requis.');

    expect(internals.setValidity).toHaveBeenCalledWith(
      { valueMissing: true },
      'Ce champ est requis.',
      undefined,
    );
  });

  it('clears validity when no flag is set', () => {
    const internals = {
      setFormValue: vi.fn(),
      setValidity: vi.fn(),
    } as unknown as ElementInternals;
    setValidity(internals, { valueMissing: false, customError: false }, '');

    expect(internals.setValidity).toHaveBeenCalledWith({});
  });

  it('does nothing when setValidity is missing, rather than throwing', () => {
    const partial = { setFormValue: vi.fn() } as unknown as ElementInternals;
    expect(() => setValidity(partial, { valueMissing: true }, 'x')).not.toThrow();
    expect(() => setValidity(null, { valueMissing: true }, 'x')).not.toThrow();
  });
});
