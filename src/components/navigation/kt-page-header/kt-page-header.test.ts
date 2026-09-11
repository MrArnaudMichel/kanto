import { describe, expect, it } from 'vitest';
import { fixture, settle } from 'kanto/test/fixture';
import './kt-page-header.js';
import type { KtPageHeader } from 'kanto';

describe('kt-page-header', () => {
  it('renders an eyebrow, a heading and a description', async () => {
    const el = await fixture<KtPageHeader>(
      '<kt-page-header eyebrow="Dashboard" heading="Good evening" description="An overview."></kt-page-header>',
    );
    expect(el.shadowRoot!.querySelector('.eyebrow')!.textContent).toContain('Dashboard');
    expect(el.shadowRoot!.querySelector('h1')!.textContent).toContain('Good evening');
    expect(el.shadowRoot!.querySelector('.description')!.textContent).toContain('An overview.');
  });

  it('drops the parts it was not given', async () => {
    const el = await fixture<KtPageHeader>('<kt-page-header></kt-page-header>');
    expect(el.shadowRoot!.querySelector('.eyebrow')).toBeNull();
    expect(el.shadowRoot!.querySelector('h1')).toBeNull();
    expect(el.shadowRoot!.querySelector('.description')).toBeNull();
  });

  it('demotes the heading for a section', async () => {
    const el = await fixture<KtPageHeader>(
      '<kt-page-header heading="Recently opened"></kt-page-header>',
    );
    expect(el.shadowRoot!.querySelector('h1')).not.toBeNull();

    el.level = 'section';
    await settle(el);
    expect(el.shadowRoot!.querySelector('h1')).toBeNull();
    expect(el.shadowRoot!.querySelector('h2')!.textContent).toContain('Recently opened');
  });

  it('offers an actions slot', async () => {
    const el = await fixture<KtPageHeader>(
      '<kt-page-header heading="Files"><button slot="actions">Upload</button></kt-page-header>',
    );
    expect(el.shadowRoot!.querySelector('slot[name="actions"]')).not.toBeNull();
  });
});
