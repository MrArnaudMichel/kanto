import { describe, expect, it, vi } from 'vitest';
import { fixture, settle } from '../../test/fixture.js';
import './kt-card.js';
import type { KtCard } from './kt-card.js';

const base = (el: KtCard) => el.shadowRoot!.querySelector('.card')!;

describe('kt-card', () => {
  it('is a plain surface by default: no role, not focusable', async () => {
    const el = await fixture<KtCard>('<kt-card>Contenu</kt-card>');
    expect(base(el).hasAttribute('role')).toBe(false);
    expect(base(el).hasAttribute('tabindex')).toBe(false);
  });

  it('becomes a focusable button when clickable', async () => {
    const el = await fixture<KtCard>('<kt-card clickable>Contenu</kt-card>');
    expect(base(el).getAttribute('role')).toBe('button');
    expect(base(el).getAttribute('tabindex')).toBe('0');
  });

  it('fires kt-card-click on pointer and on keyboard', async () => {
    const el = await fixture<KtCard>('<kt-card clickable>Contenu</kt-card>');
    const listener = vi.fn();
    el.addEventListener('kt-card-click', listener);

    base(el).dispatchEvent(new MouseEvent('click'));
    expect(listener).toHaveBeenCalledTimes(1);

    base(el).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    base(el).dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
    expect(listener).toHaveBeenCalledTimes(3);
  });

  it('stays inert when it is not clickable', async () => {
    const el = await fixture<KtCard>('<kt-card>Contenu</kt-card>');
    const listener = vi.fn();
    el.addEventListener('kt-card-click', listener);

    base(el).dispatchEvent(new MouseEvent('click'));
    base(el).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(listener).not.toHaveBeenCalled();
  });

  it('renders no media well without an image', async () => {
    const el = await fixture<KtCard>('<kt-card>Contenu</kt-card>');
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
    const el = await fixture<KtCard>('<kt-card image="/x.png" image-alt="Aperçu"></kt-card>');
    const img = el.shadowRoot!.querySelector('img')!;
    expect(img.getAttribute('src')).toBe('/x.png');
    expect(img.getAttribute('alt')).toBe('Aperçu');
  });
});
