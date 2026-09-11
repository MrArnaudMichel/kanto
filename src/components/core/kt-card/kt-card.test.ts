import { describe, expect, it, vi } from 'vitest';
import { fixture, settle } from 'kanto-ds/test/fixture';
import './kt-card.js';
import type { KtCard } from 'kanto-ds';

const base = (el: KtCard) => el.shadowRoot!.querySelector('.card')!;

describe('kt-card', () => {
  it('is a plain surface by default: no role, not focusable', async () => {
    const el = await fixture<KtCard>('<kt-card>Content</kt-card>');
    expect(base(el).hasAttribute('role')).toBe(false);
    expect(base(el).hasAttribute('tabindex')).toBe(false);
  });

  it('becomes a focusable button when clickable', async () => {
    const el = await fixture<KtCard>('<kt-card clickable>Content</kt-card>');
    expect(base(el).getAttribute('role')).toBe('button');
    expect(base(el).getAttribute('tabindex')).toBe('0');
  });

  it('reports the selected state only when it is a control', async () => {
    const plain = await fixture<KtCard>('<kt-card selected>Content</kt-card>');
    expect(base(plain).classList.contains('selected')).toBe(true);
    // Not a control, so nothing to press: no aria-pressed to contradict it.
    expect(base(plain).hasAttribute('aria-pressed')).toBe(false);

    const toggle = await fixture<KtCard>('<kt-card clickable>Content</kt-card>');
    expect(base(toggle).getAttribute('aria-pressed')).toBe('false');

    toggle.selected = true;
    await settle(toggle);
    expect(base(toggle).getAttribute('aria-pressed')).toBe('true');
    expect(base(toggle).classList.contains('selected')).toBe(true);
  });

  it('fires kt-card-click on pointer and on keyboard', async () => {
    const el = await fixture<KtCard>('<kt-card clickable>Content</kt-card>');
    const listener = vi.fn();
    el.addEventListener('kt-card-click', listener);

    base(el).dispatchEvent(new MouseEvent('click'));
    expect(listener).toHaveBeenCalledTimes(1);

    base(el).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    base(el).dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
    expect(listener).toHaveBeenCalledTimes(3);
  });

  it('stays inert when it is not clickable', async () => {
    const el = await fixture<KtCard>('<kt-card>Content</kt-card>');
    const listener = vi.fn();
    el.addEventListener('kt-card-click', listener);

    base(el).dispatchEvent(new MouseEvent('click'));
    base(el).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(listener).not.toHaveBeenCalled();
  });

  it('collapses a header and footer nothing was slotted into', async () => {
    const bare = await fixture<KtCard>('<kt-card>Body only</kt-card>');
    expect(bare.shadowRoot!.querySelector('.header')!.classList.contains('empty')).toBe(true);
    expect(bare.shadowRoot!.querySelector('.footer')!.classList.contains('empty')).toBe(true);

    const full = await fixture<KtCard>(
      '<kt-card><h6 slot="header">Title</h6>Body<span slot="footer">More</span></kt-card>',
    );
    expect(full.shadowRoot!.querySelector('.header')!.classList.contains('empty')).toBe(false);
    expect(full.shadowRoot!.querySelector('.footer')!.classList.contains('empty')).toBe(false);
  });

  it('renders no media well without an image', async () => {
    const el = await fixture<KtCard>('<kt-card>Content</kt-card>');
    expect(el.shadowRoot!.querySelector('.media')).toBeNull();
  });

  it('exposes the media size as a custom property and lets the class pick the axis', async () => {
    const el = await fixture<KtCard>('<kt-card image="/x.png" image-size="80px"></kt-card>');
    const media = el.shadowRoot!.querySelector<HTMLElement>('.media')!;
    expect(media.style.getPropertyValue('--media-size')).toBe('80px');
    expect(base(el).classList.contains('image-left')).toBe(true);

    el.imagePosition = 'top';
    await settle(el);
    expect(base(el).classList.contains('image-top')).toBe(true);
    expect(base(el).classList.contains('image-left')).toBe(false);
  });

  it('renders the convenience image with its alt text', async () => {
    const el = await fixture<KtCard>('<kt-card image="/x.png" image-alt="Preview"></kt-card>');
    const img = el.shadowRoot!.querySelector('img')!;
    expect(img.getAttribute('src')).toBe('/x.png');
    expect(img.getAttribute('alt')).toBe('Preview');
  });
});
