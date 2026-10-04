/**
 * The shell, laid out: a sidebar beside the content when wide — a rail when
 * collapsed — and a drawer over it when narrow.
 */
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { fixture, settle } from '#test/fixture';
import '../../../styles.css';
import './kt-app-shell.js';
import type { KtAppShell } from 'kanto-ds';

async function mount(width: number, extra = ''): Promise<KtAppShell> {
  const el = await fixture<KtAppShell>(
    `<kt-app-shell ${extra} style="width: ${width}px; height: 480px">
      <strong slot="header">Northwind</strong>
      <nav slot="sidebar" aria-label="Pages"><a href="#">Overview</a><a href="#">Invoices</a></nav>
      <p>${'Content. '.repeat(400)}</p>
    </kt-app-shell>`,
  );
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await settle(el);
  return el;
}

const part = (el: KtAppShell, selector: string) =>
  el.shadowRoot!.querySelector<HTMLElement>(selector)!;
const box = (el: KtAppShell, selector: string) => part(el, selector).getBoundingClientRect();
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('kt-app-shell, wide', () => {
  it('sets the sidebar beside the content, under the header, and scrolls the content alone', async () => {
    const el = await mount(1100);
    expect(el.hasAttribute('narrow')).toBe(false);
    const aside = box(el, 'aside');
    const main = box(el, 'main');
    expect(Math.round(aside.width)).toBe(240);
    expect(main.left).toBeGreaterThanOrEqual(aside.right - 1);
    expect(aside.top).toBeGreaterThanOrEqual(box(el, '.header').bottom - 1);
    expect(part(el, 'main').scrollHeight).toBeGreaterThan(part(el, 'main').clientHeight);
    expect(Math.round(el.getBoundingClientRect().height)).toBe(480);
  });

  it('narrows the sidebar to a rail when collapsed', async () => {
    const el = await mount(1100, 'collapsed');
    expect(Math.round(box(el, 'aside').width)).toBe(64);
  });
});

describe('kt-app-shell, narrow', () => {
  it('hides the sidebar off to the side, out of reach of Tab, and gives the content the width', async () => {
    const el = await mount(600);
    expect(el.hasAttribute('narrow')).toBe(true);
    expect(part(el, 'aside').inert).toBe(true);
    expect(box(el, 'aside').right).toBeLessThanOrEqual(el.getBoundingClientRect().left + 1);
    expect(Math.round(box(el, 'main').width)).toBe(600);
    expect(part(el, '.toggle').getAttribute('aria-expanded')).toBe('false');
  });

  it('opens it as a drawer over the content, with a backdrop, and moves the focus in', async () => {
    const el = await mount(600);
    part(el, '.toggle').click();
    await settle(el);
    await wait(450);
    expect(el.sidebarOpen).toBe(true);
    expect(part(el, 'aside').inert).toBe(false);
    expect(Math.abs(box(el, 'aside').left - el.getBoundingClientRect().left)).toBeLessThan(1);
    expect(getComputedStyle(part(el, '.backdrop')).display).not.toBe('none');
    expect(el.shadowRoot!.activeElement).toBe(part(el, 'aside'));
  });

  it('closes on Escape and on the backdrop, and gives the focus back to its toggle', async () => {
    const el = await mount(600);
    part(el, '.toggle').click();
    await settle(el);
    await userEvent.keyboard('{Escape}');
    await settle(el);
    expect(el.sidebarOpen).toBe(false);
    expect(el.shadowRoot!.activeElement).toBe(part(el, '.toggle'));

    part(el, '.toggle').click();
    await settle(el);
    part(el, '.backdrop').click();
    await settle(el);
    expect(el.sidebarOpen).toBe(false);
  });

  it('turns back into a sidebar when it grows wide again', async () => {
    const el = await mount(600);
    el.style.width = '1100px';
    await wait(100);
    await settle(el);
    expect(el.hasAttribute('narrow')).toBe(false);
    expect(part(el, 'aside').inert).toBe(false);
  });
});
