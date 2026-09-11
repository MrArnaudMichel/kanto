import { describe, expect, it, vi } from 'vitest';
import { fixture, settle } from 'kanto-ds/test/fixture';
import './kt-button.js';
import type { KtButton } from 'kanto-ds';

const nativeButton = (el: KtButton) => el.shadowRoot!.querySelector('button')!;

describe('kt-button', () => {
  it('defaults to a medium primary button', async () => {
    const el = await fixture<KtButton>('<kt-button>Submit</kt-button>');
    expect(nativeButton(el).classList.contains('primary')).toBe(true);
    expect(nativeButton(el).classList.contains('medium')).toBe(true);
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
