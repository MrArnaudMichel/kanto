/**
 * The React 19 path, with the real React: no wrapper, plain `kt-*` tags.
 *
 * `kanto-ds/react/jsx` only declares types; what it promises — that React 19
 * hands an array to `options` as a property and wires `onkt-change` to the
 * `kt-change` event — is React's own behaviour, so it is checked against
 * React itself rather than assumed.
 */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../index.js';
import type {} from './jsx.js';
import type { KtOption, KtSelect } from 'kanto-ds';

type SelectProps = React.JSX.IntrinsicElements['kt-select'];

const OPTIONS: KtOption[] = [
  { id: 'fr', label: 'France' },
  { id: 'be', label: 'Belgium' },
];

// Type-level checks: tsc reads these, the test runner does not need to.
const typed: SelectProps = {
  options: OPTIONS,
  'onkt-change': (event) => {
    const value: string | number | null = event.detail.value;
    void value;
  },
};
// @ts-expect-error a prop kt-select does not have
const unknownProp: SelectProps = { colour: 'red' };
void unknownProp;

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | undefined;
let host: HTMLElement | undefined;

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
});

async function render(props: SelectProps): Promise<KtSelect> {
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  await act(async () => root!.render(createElement('kt-select', props)));
  return host.querySelector('kt-select')!;
}

describe('kt-select in React 19, without a wrapper', () => {
  it('receives an array prop as a property, not a stringified attribute', async () => {
    const el = await render(typed);

    expect(el.options).toBe(OPTIONS);
    expect(el.getAttribute('options')).toBeNull();
  });

  it('calls onkt-change with the event and its detail', async () => {
    const onChange = vi.fn();
    const el = await render({ options: OPTIONS, 'onkt-change': onChange });

    el.dispatchEvent(new CustomEvent('kt-change', { detail: { value: 'be' }, bubbles: true }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect((onChange.mock.calls[0]![0] as CustomEvent).detail).toEqual({ value: 'be' });
  });
});
