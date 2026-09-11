import { afterEach, describe, expect, it, vi } from 'vitest';
import { fixture, settle } from '#test/fixture';
import './kt-toast.js';
import '../kt-toast-container/kt-toast-container.js';
import { toaster } from 'kanto-ds';
import type { KtToast } from 'kanto-ds';
import type { KtToastContainer } from 'kanto-ds';

const surface = (el: KtToast) => el.shadowRoot!.querySelector('.toast')!;

describe('kt-toast', () => {
  it('picks an icon per variant', async () => {
    const success = await fixture<KtToast>('<kt-toast variant="success"></kt-toast>');
    expect(success.shadowRoot!.querySelector('kt-icon')!.getAttribute('name')).toBe('circle-check');

    const error = await fixture<KtToast>('<kt-toast variant="error"></kt-toast>');
    expect(error.shadowRoot!.querySelector('kt-icon')!.getAttribute('name')).toBe('circle-alert');
  });

  it('interrupts for an error and waits its turn otherwise', async () => {
    const info = await fixture<KtToast>('<kt-toast variant="information"></kt-toast>');
    expect(surface(info).getAttribute('role')).toBe('status');
    expect(surface(info).getAttribute('aria-live')).toBe('polite');

    const error = await fixture<KtToast>('<kt-toast variant="error"></kt-toast>');
    expect(surface(error).getAttribute('role')).toBe('alert');
    expect(surface(error).getAttribute('aria-live')).toBe('assertive');
  });

  it('shows a dismiss button only when dismissible', async () => {
    const plain = await fixture<KtToast>('<kt-toast></kt-toast>');
    expect(plain.shadowRoot!.querySelector('.close')).toBeNull();

    const closable = await fixture<KtToast>('<kt-toast dismissible></kt-toast>');
    const closed = vi.fn();
    closable.addEventListener('kt-toast-close', closed);

    closable.shadowRoot!.querySelector<HTMLButtonElement>('.close')!.click();
    expect(closed).toHaveBeenCalledOnce();
  });

  it('shows no countdown without a duration', async () => {
    const el = await fixture<KtToast>('<kt-toast></kt-toast>');
    expect(el.shadowRoot!.querySelector('kt-progress-bar')).toBeNull();
  });

  it('counts down and closes itself', async () => {
    vi.useFakeTimers();
    try {
      const el = document.createElement('kt-toast');
      el.duration = 200;
      const closed = vi.fn();
      el.addEventListener('kt-toast-close', closed);
      document.body.append(el);
      await el.updateComplete;

      expect(el.shadowRoot!.querySelector('kt-progress-bar')).not.toBeNull();

      vi.advanceTimersByTime(100);
      expect(closed).not.toHaveBeenCalled();

      vi.advanceTimersByTime(150);
      expect(closed).toHaveBeenCalledOnce();
      el.remove();
    } finally {
      vi.useRealTimers();
    }
  });

  it('pauses and resumes the countdown', async () => {
    vi.useFakeTimers();
    try {
      const el = document.createElement('kt-toast');
      el.duration = 200;
      const closed = vi.fn();
      el.addEventListener('kt-toast-close', closed);
      document.body.append(el);
      await el.updateComplete;

      vi.advanceTimersByTime(100);
      el.pause();
      vi.advanceTimersByTime(1000);
      expect(closed).not.toHaveBeenCalled();

      el.resume();
      vi.advanceTimersByTime(150);
      expect(closed).toHaveBeenCalledOnce();
      el.remove();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('kt-toast-container', () => {
  it('appends toasts and removes them on close', async () => {
    const el = await fixture<KtToastContainer>('<kt-toast-container></kt-toast-container>');

    const toast = el.show({ heading: 'Entity created', variant: 'success' });
    await settle(el);

    expect(el.toasts).toHaveLength(1);
    expect(toast.heading).toBe('Entity created');

    toast.close();
    expect(el.toasts).toHaveLength(0);
  });

  it('drops the oldest toast past the limit', async () => {
    const el = await fixture<KtToastContainer>('<kt-toast-container></kt-toast-container>');
    el.limit = 2;

    el.show({ heading: 'un' });
    el.show({ heading: 'deux' });
    el.show({ heading: 'trois' });
    await settle(el);

    expect(el.toasts.map((t) => t.heading)).toEqual(['deux', 'trois']);
  });

  it('stacks newest towards the screen edge', async () => {
    const bottom = await fixture<KtToastContainer>('<kt-toast-container></kt-toast-container>');
    bottom.show({ heading: 'un' });
    bottom.show({ heading: 'deux' });
    expect(bottom.toasts.map((t) => t.heading)).toEqual(['un', 'deux']);

    const top = await fixture<KtToastContainer>(
      '<kt-toast-container position="top-right"></kt-toast-container>',
    );
    top.show({ heading: 'un' });
    top.show({ heading: 'deux' });
    expect(top.toasts.map((t) => t.heading)).toEqual(['deux', 'un']);
  });

  it('clears everything', async () => {
    const el = await fixture<KtToastContainer>('<kt-toast-container></kt-toast-container>');
    el.show({ heading: 'un' });
    el.show({ heading: 'deux' });

    el.clear();
    expect(el.toasts).toHaveLength(0);
  });
});

describe('toaster', () => {
  afterEach(() => {
    toaster.clear();
    document.querySelector('kt-toast-container')?.remove();
  });

  it('creates one container on demand and reuses it', () => {
    toaster.success('Entity created');
    toaster.info('Synchronisation en cours');

    const containers = document.querySelectorAll('kt-toast-container');
    expect(containers).toHaveLength(1);
    expect(containers[0]!.toasts).toHaveLength(2);
  });

  it('adopts a container already in the document', async () => {
    const existing = await fixture<KtToastContainer>(
      '<kt-toast-container position="top-left"></kt-toast-container>',
    );
    toaster.success('Entity created');

    expect(existing.toasts).toHaveLength(1);
    expect(document.querySelectorAll('kt-toast-container')).toHaveLength(1);
  });

  it('leaves errors on screen and lets the rest expire', () => {
    const error = toaster.error('Could not save');
    const success = toaster.success('Entity created');

    expect(error.duration).toBe(0);
    expect(error.variant).toBe('error');
    expect(success.duration).toBe(4000);
  });

  it('lets the caller override the defaults', () => {
    const toast = toaster.error('Failed', { duration: 1000, dismissible: false });
    expect(toast.duration).toBe(1000);
    expect(toast.dismissible).toBe(false);
  });
});
