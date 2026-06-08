import { describe, expect, it } from 'vitest';
import { LitElement } from 'lit';
import { defineElement } from './kt-element.js';
import { emit, uniqueId } from './events.js';

describe('defineElement', () => {
  it('registers the element', () => {
    class First extends LitElement {}
    defineElement('kt-test-first', First);
    expect(customElements.get('kt-test-first')).toBe(First);
  });

  it('ignores a second registration instead of throwing', () => {
    class Original extends LitElement {}
    class Duplicate extends LitElement {}
    defineElement('kt-test-dupe', Original);

    expect(() => defineElement('kt-test-dupe', Duplicate)).not.toThrow();
    expect(customElements.get('kt-test-dupe')).toBe(Original);
  });
});

describe('emit', () => {
  it('dispatches a composed, bubbling, cancelable event carrying the detail', () => {
    const host = document.createElement('div');
    const parent = document.createElement('div');
    parent.append(host);
    document.body.append(parent);

    let seen: CustomEvent<{ value: number }> | undefined;
    parent.addEventListener('kt-change', (e) => {
      seen = e as CustomEvent<{ value: number }>;
    });

    emit(host, 'kt-change', { value: 7 });

    expect(seen?.detail).toEqual({ value: 7 });
    expect(seen?.composed).toBe(true);
    expect(seen?.cancelable).toBe(true);
    parent.remove();
  });

  it('reports back when a listener cancels it', () => {
    const host = document.createElement('div');
    host.addEventListener('kt-change', (e) => e.preventDefault());
    expect(emit(host, 'kt-change').defaultPrevented).toBe(true);
  });
});

describe('uniqueId', () => {
  it('never repeats a value', () => {
    const ids = [uniqueId('kt-input'), uniqueId('kt-input'), uniqueId('kt-input')];
    expect(new Set(ids).size).toBe(3);
    expect(ids[0]).toMatch(/^kt-input-\d+$/);
  });
});
