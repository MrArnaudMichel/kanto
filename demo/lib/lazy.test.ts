import { describe, expect, it, vi } from 'vitest';
import { lazyLoader } from './lazy.js';

describe('lazyLoader', () => {
  it('is pending, then has what arrived, and asks for it once', async () => {
    const load = vi.fn(() => Promise.resolve('screen'));
    const changed = vi.fn();
    const get = lazyLoader({ a: load }, changed);
    expect(get('a')).toEqual({ state: 'loading' });
    expect(get('a')).toEqual({ state: 'loading' });
    await vi.waitFor(() => expect(changed).toHaveBeenCalledOnce());
    expect(get('a')).toEqual({ state: 'ready', value: 'screen' });
    expect(load).toHaveBeenCalledOnce();
  });

  it('says it failed, and tries again when asked after', async () => {
    let fail = true;
    const load = vi.fn(() => (fail ? Promise.reject(new Error('offline')) : Promise.resolve(1)));
    const changed = vi.fn();
    const get = lazyLoader({ a: load }, changed);
    get('a');
    await vi.waitFor(() => expect(changed).toHaveBeenCalledOnce());
    expect(get('a')).toEqual({ state: 'failed' });
    fail = false;
    get.retry('a');
    expect(get('a')).toEqual({ state: 'loading' });
    await vi.waitFor(() => expect(get('a')).toEqual({ state: 'ready', value: 1 }));
  });

  it('knows nothing of a name it was not given', () => {
    expect(lazyLoader({}, () => {})('nope')).toBeNull();
  });
});
