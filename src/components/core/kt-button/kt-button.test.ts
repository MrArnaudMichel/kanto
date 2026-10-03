import { describe, expect, it, vi } from 'vitest';
import { fixture, settle } from '#test/fixture';
import './kt-button.js';
import type { KtButton } from 'kanto-ds';

const nativeButton = (el: KtButton) => el.shadowRoot!.querySelector('button')!;

describe('kt-button', () => {
  it('defaults to a medium primary button', async () => {
    const el = await fixture<KtButton>('<kt-button>Submit</kt-button>');
    expect(nativeButton(el).classList.contains('primary')).toBe(true);
    expect(nativeButton(el).classList.contains('medium')).toBe(true);
  });

  it('exposes a popup it controls on the inner button', async () => {
    const el = await fixture<KtButton>('<kt-button>Actions</kt-button>');
    expect(nativeButton(el).hasAttribute('aria-expanded')).toBe(false);
    expect(nativeButton(el).hasAttribute('aria-haspopup')).toBe(false);

    el.popup = 'menu';
    el.expanded = true;
    await settle(el);

    expect(nativeButton(el).getAttribute('aria-haspopup')).toBe('menu');
    expect(nativeButton(el).getAttribute('aria-expanded')).toBe('true');
  });

  it('reflects the variant and size onto the inner button', async () => {
    const el = await fixture<KtButton>('<kt-button variant="danger" size="large">X</kt-button>');
    expect(nativeButton(el).classList.contains('danger')).toBe(true);
    expect(nativeButton(el).classList.contains('large')).toBe(true);
  });

  it('scales the icon with the button size', async () => {
    const el = await fixture<KtButton>('<kt-button icon="search" size="small">Search</kt-button>');
    expect(el.shadowRoot!.querySelector('kt-icon')!.getAttribute('size')).toBe('16');

    el.size = 'large';
    await settle(el);
    expect(el.shadowRoot!.querySelector('kt-icon')!.getAttribute('size')).toBe('24');
  });

  it('becomes icon-only when an icon is set with no label text', async () => {
    const iconOnly = await fixture<KtButton>('<kt-button icon="x" label="Close"></kt-button>');
    expect(nativeButton(iconOnly).classList.contains('icon-only')).toBe(true);
    expect(nativeButton(iconOnly).getAttribute('aria-label')).toBe('Close');

    const withText = await fixture<KtButton>('<kt-button icon="x">Close</kt-button>');
    expect(nativeButton(withText).classList.contains('icon-only')).toBe(false);
  });

  it('places the icon after the label when asked', async () => {
    const el = await fixture<KtButton>(
      '<kt-button icon="chevron-right" icon-position="right">Next</kt-button>',
    );
    const children = [...nativeButton(el).children].map((c) => c.localName);
    expect(children.indexOf('slot')).toBeLessThan(children.indexOf('kt-icon'));
  });

  it('swallows clicks while disabled', async () => {
    const el = await fixture<KtButton>('<kt-button disabled>Submit</kt-button>');
    const listener = vi.fn();
    el.addEventListener('click', listener);

    nativeButton(el).dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    expect(listener).not.toHaveBeenCalled();
    expect(nativeButton(el).disabled).toBe(true);
  });

  it('submits the enclosing form despite the shadow boundary', async () => {
    const form = await fixture<HTMLFormElement>(
      '<form><kt-button type="submit">Send</kt-button></form>',
    );
    const submitted = vi.fn((e: Event) => e.preventDefault());
    form.addEventListener('submit', submitted);

    const button = form.querySelector('kt-button')!;
    await settle(button);
    nativeButton(button).click();

    expect(submitted).toHaveBeenCalledOnce();
  });

  it('leaves the form alone for type="button"', async () => {
    const form = await fixture<HTMLFormElement>(
      '<form><kt-button>Does not submit</kt-button></form>',
    );
    const submitted = vi.fn((e: Event) => e.preventDefault());
    form.addEventListener('submit', submitted);

    const button = form.querySelector('kt-button')!;
    await settle(button);
    nativeButton(button).click();

    expect(submitted).not.toHaveBeenCalled();
  });

  it('forwards focus to the inner button', async () => {
    const el = await fixture<KtButton>('<kt-button>Submit</kt-button>');
    el.focus();
    expect(el.shadowRoot!.activeElement).toBe(nativeButton(el));
  });
});

describe('kt-button run()', () => {
  const icon = (el: KtButton) =>
    el.shadowRoot!.querySelector('[part="icon"]')?.getAttribute('name');
  const status = (el: KtButton) =>
    el.shadowRoot!.querySelector('[role="status"]')!.textContent!.trim();
  /** The label on show: the replacement, or the slotted text when it is not hidden. */
  const shown = (el: KtButton) => {
    const replaced = el.shadowRoot!.querySelector('button > span');
    if (replaced) return replaced.textContent!.trim();
    expect(el.shadowRoot!.querySelector('slot')!.hidden).toBe(false);
    return el.textContent!.trim();
  };
  /** Resolves or rejects when told to. */
  function deferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (error: unknown) => void;
    const promise = new Promise<T>((yes, no) => {
      resolve = yes;
      reject = no;
    });
    return { promise, resolve, reject };
  }

  it('runs the action once, busy until it settles, and returns its result', async () => {
    const el = await fixture<KtButton>('<kt-button icon="send">Send</kt-button>');
    const job = deferred<string>();
    const action = vi.fn(() => job.promise);
    const first = el.run(action);
    const second = el.run(action);
    await settle(el);
    expect(action).toHaveBeenCalledOnce();
    expect(nativeButton(el).getAttribute('aria-busy')).toBe('true');
    expect(nativeButton(el).getAttribute('aria-disabled')).toBe('true');

    job.resolve('ok');
    expect(await first).toBe('ok');
    expect(await second).toBe('ok');
  });

  it('says it is done — the done label and a tick — then goes back', async () => {
    vi.useFakeTimers();
    try {
      const el = await fixture<KtButton>(
        '<kt-button icon="send" done-label="Sent">Send</kt-button>',
      );
      await el.run(() => Promise.resolve());
      await settle(el);
      expect(icon(el)).toBe('check');
      expect(shown(el)).toBe('Sent');
      expect(status(el)).toBe('Sent');

      await vi.advanceTimersByTimeAsync(KtButtonClass().DONE_MS);
      await settle(el);
      expect(icon(el)).toBe('send');
      expect(shown(el)).toBe('Send');
      expect(status(el)).toBe('');
    } finally {
      vi.useRealTimers();
    }
  });

  it('keeps its own label without a done label, and still shows the tick', async () => {
    const el = await fixture<KtButton>('<kt-button icon="send">Send</kt-button>');
    await el.run(() => Promise.resolve());
    await settle(el);
    expect(icon(el)).toBe('check');
    expect(shown(el)).toBe('Send');
  });

  it('says it failed, hands the error back, and can be run again after', async () => {
    vi.useFakeTimers();
    try {
      const el = await fixture<KtButton>(
        '<kt-button icon="send" failed-label="Not sent">Send</kt-button>',
      );
      const error = new Error('offline');
      await expect(el.run(() => Promise.reject(error))).rejects.toBe(error);
      await settle(el);
      expect(icon(el)).toBe('circle-alert');
      expect(shown(el)).toBe('Not sent');
      expect(status(el)).toBe('Not sent');

      await vi.advanceTimersByTimeAsync(KtButtonClass().DONE_MS);
      await settle(el);
      expect(icon(el)).toBe('send');
      const action = vi.fn(() => Promise.resolve(1));
      expect(await el.run(action)).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('ignores clicks while busy', async () => {
    const el = await fixture<KtButton>('<kt-button>Send</kt-button>');
    const job = deferred<void>();
    void el.run(() => job.promise);
    await settle(el);
    const clicked = vi.fn();
    el.addEventListener('click', clicked);
    nativeButton(el).click();
    expect(clicked).not.toHaveBeenCalled();
    job.resolve();
  });

  it('shows a spinner while busy for an icon with no flight of its own', async () => {
    const el = await fixture<KtButton>('<kt-button icon="download">Export</kt-button>');
    const job = deferred<void>();
    void el.run(() => job.promise);
    await settle(el);
    expect(icon(el)).toBe('loader-circle');
    job.resolve();
  });
});

function KtButtonClass() {
  return customElements.get('kt-button') as unknown as { DONE_MS: number };
}
