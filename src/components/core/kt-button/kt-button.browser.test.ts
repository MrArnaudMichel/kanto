/**
 * run(), as it is seen: the plane flying off, the tick coming in, the width
 * following the label, the shake of a failure.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Send } from 'lucide';
import { fixture, settle } from '#test/fixture';
import '../../../styles.css';
import './kt-button.js';
import { registerIcons } from 'kanto-ds';
import type { KtButton } from 'kanto-ds';
import { PLANE, POINTS, resample } from './morph.js';

registerIcons({ Send });

const TOKENS = ['--duration-instant', '--duration-fast', '--duration-normal', '--duration-slow'];
afterEach(() => {
  for (const token of TOKENS) document.documentElement.style.removeProperty(token);
});

/** Every animation run() plays, wherever it plays it. */
function played(el: KtButton): Map<string, Animation> {
  const all = [el, ...el.shadowRoot!.querySelectorAll('*')].flatMap((node) => node.getAnimations());
  return new Map(all.filter((a) => a.id.startsWith('kt-button')).map((a) => [a.id, a]));
}
const keyframes = (animation: Animation) => (animation.effect as KeyframeEffect).getKeyframes();
const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** The flight, once the spinner has become the plane again and it starts. */
function takeOff(el: KtButton): Promise<Animation> {
  return new Promise((resolve) => {
    const look = () => {
      const leave = played(el).get('kt-button-leave');
      if (leave) resolve(leave);
      else requestAnimationFrame(look);
    };
    look();
  });
}

type Point = [number, number];
const pointsOf = (d: string): Point[] =>
  d
    .replace(/[MZ]/g, '')
    .split('L')
    .map((pair) => pair.trim().split(/\s+/).map(Number) as Point);
const PLANE_POINTS = resample(PLANE, POINTS);
/** How far, at most, the drawn outline is from a shape, in icon units. */
const offBy = (svg: Element, shape: readonly (readonly number[])[]) =>
  Math.max(
    ...pointsOf(svg.querySelector('.outline')!.getAttribute('d')!).map((p, i) =>
      Math.hypot(p[0] - shape[i]![0]!, p[1] - shape[i]![1]!),
    ),
  );
const plane = (svg: Element) => offBy(svg, PLANE_POINTS);
/** How far the outline is from a ring of radius 9 round the centre. */
const ring = (svg: Element) =>
  Math.max(
    ...pointsOf(svg.querySelector('.outline')!.getAttribute('d')!).map((p) =>
      Math.abs(Math.hypot(p[0] - 12, p[1] - 12) - 9),
    ),
  );
/** The share of the outline left undrawn: the spinner's opening. */
const gap = (svg: Element) =>
  Number((svg.querySelector('.outline')!.getAttribute('stroke-dasharray') ?? '1 0').split(' ')[1]);

async function mount(): Promise<KtButton> {
  const el = await fixture<KtButton>(
    '<kt-button icon="send" done-label="Sent to the team">Send</kt-button>',
  );
  await new Promise((resolve) => requestAnimationFrame(resolve));
  return el;
}

describe('kt-button run(), in motion', () => {
  it('flies the plane off to the top right, then brings the tick in', async () => {
    const el = await mount();
    const seen: Map<string, Animation>[] = [];
    const watching = setInterval(() => seen.push(played(el)), 10);
    await el.run(() => Promise.resolve());
    await settle(el);
    seen.push(played(el));
    clearInterval(watching);

    const leave = seen.map((m) => m.get('kt-button-leave')).find(Boolean)!;
    expect(leave).toBeDefined();
    const [x, y] = String(keyframes(leave).at(-1)!.translate).split(' ').map(parseFloat);
    expect(x).toBeGreaterThan(0);
    expect(y).toBeLessThan(0);
    expect(Number(keyframes(leave).at(-1)!.opacity)).toBe(0);
    expect(played(el).has('kt-button-arrive')).toBe(true);
  });

  it('widens to the done label instead of jumping', async () => {
    const el = await mount();
    const before = el.getBoundingClientRect().width;
    await el.run(() => Promise.resolve());
    await settle(el);
    const resize = played(el).get('kt-button-resize')!;
    expect(resize).toBeDefined();
    expect(parseFloat(String(keyframes(resize)[0]!.width))).toBeCloseTo(before, 0);
    await resize.finished;
    expect(el.getBoundingClientRect().width).toBeGreaterThan(before);
  });

  it('shakes when the action fails', async () => {
    const el = await mount();
    await el.run(() => Promise.reject(new Error('offline'))).catch(() => undefined);
    await settle(el);
    expect(played(el).has('kt-button-shake')).toBe(true);
    expect(played(el).has('kt-button-leave')).toBe(false);
  });

  it('only changes its label and icon when the theme says no motion', async () => {
    for (const token of TOKENS) document.documentElement.style.setProperty(token, '0s');
    const el = await mount();
    await el.run(() => Promise.resolve());
    await settle(el);
    expect(played(el).size).toBe(0);
    expect(el.shadowRoot!.querySelector('[part="icon"]')!.getAttribute('name')).toBe('check');
  });

  it('eases each leg of the flight on its own: back slowing, off speeding up', async () => {
    const el = await mount();
    const running = el.run(() => Promise.resolve());
    const leave = await takeOff(el);
    expect(leave.effect!.getTiming().easing).toBe('linear');
    const [, back, off] = keyframes(leave);
    expect(back!.easing).not.toBe('linear');
    expect(off).toBeDefined();
    expect(keyframes(leave)[1]!.easing).not.toBe(keyframes(leave)[0]!.easing);
    await running;
  });

  it('turns the plane into a spinning ring while it waits', async () => {
    const el = await mount();
    let land!: () => void;
    const running = el.run(() => new Promise<void>((resolve) => (land = resolve)));
    await settle(el);
    await wait(600);
    const svg = el.shadowRoot!.querySelector('svg.morph')!;
    expect(svg).not.toBeNull();
    expect(ring(svg)).toBeLessThan(0.05);
    expect(gap(svg)).toBeGreaterThan(0.2);
    const offset = svg.querySelector('.outline')!.getAttribute('stroke-dashoffset');
    await wait(100);
    expect(svg.querySelector('.outline')!.getAttribute('stroke-dashoffset')).not.toBe(offset);
    land();
    await running;
  });

  for (const after of [700, 120]) {
    it(`becomes the plane again and flies, without a jump (done after ${after}ms)`, async () => {
      const el = await mount();
      const shapes: { at: number; points: Point[] }[] = [];
      let on = true;
      const watch = (at: number) => {
        const path = el.shadowRoot!.querySelector('svg.morph .outline');
        if (path?.getAttribute('d')) shapes.push({ at, points: pointsOf(path.getAttribute('d')!) });
        if (on) requestAnimationFrame(watch);
      };
      requestAnimationFrame(watch);
      const leaving = new Promise<void>((resolve) => {
        const look = () =>
          played(el).has('kt-button-leave') ? resolve() : requestAnimationFrame(look);
        look();
      });
      const running = el.run(() => wait(after));
      await leaving;
      on = false;
      const svg = el.shadowRoot!.querySelector('svg.morph')!;
      // At take-off: the plane, whole — no gap, the fold back.
      expect(plane(svg)).toBeLessThan(0.05);
      expect(gap(svg)).toBeLessThan(0.01);
      expect(Number(getComputedStyle(svg.querySelector('.fold')!).opacity)).toBeCloseTo(1, 2);
      // The most any point moves in a 60 Hz frame's time: a loaded machine
      // drops frames, which spreads a move over more time, not into a jump.
      let worst = 0;
      for (let f = 1; f < shapes.length; f += 1) {
        const frames = Math.max(1, (shapes[f]!.at - shapes[f - 1]!.at) / (1000 / 60));
        shapes[f]!.points.forEach((point, i) => {
          const before = shapes[f - 1]!.points[i]!;
          worst = Math.max(worst, Math.hypot(point[0] - before[0], point[1] - before[1]) / frames);
        });
      }
      expect(shapes.length).toBeGreaterThan(5);
      expect(worst).toBeLessThan(1.5);
      await running;
    });
  }

  it('becomes the plane again before it says it failed', async () => {
    const el = await mount();
    const running = el.run(() => wait(500).then(() => Promise.reject(new Error('offline'))));
    await running.catch(() => undefined);
    await settle(el);
    expect(el.shadowRoot!.querySelector('[part="icon"]')!.getAttribute('name')).toBe(
      'circle-alert',
    );
    expect(played(el).has('kt-button-shake')).toBe(true);
  });

  it('keeps the plane, still, when the theme says no motion', async () => {
    for (const token of TOKENS) document.documentElement.style.setProperty(token, '0s');
    const el = await mount();
    let land!: () => void;
    const running = el.run(() => new Promise<void>((resolve) => (land = resolve)));
    await settle(el);
    expect(el.shadowRoot!.querySelector('svg.morph')).toBeNull();
    expect(el.shadowRoot!.querySelector('[part="icon"]')!.getAttribute('name')).toBe('send');
    land();
    await running;
  });

  /** How many lines a text runs to: the distinct tops of its line boxes. */
  function lines(node: Node): number {
    const range = document.createRange();
    range.selectNodeContents(node);
    return new Set([...range.getClientRects()].map((rect) => Math.round(rect.top))).size;
  }

  /** Steps through a running resize, checking the label stays one line, clipped. */
  function expectOneLine(el: KtButton, label: () => Node): void {
    const resize = played(el).get('kt-button-resize')!;
    expect(resize).toBeDefined();
    const duration = resize.effect!.getComputedTiming().duration as number;
    for (const at of [0, 0.25, 0.5, 0.75]) {
      resize.pause();
      resize.currentTime = duration * at;
      expect(lines(label())).toBe(1);
      // What does not fit yet is clipped at the button's edge, not spilled.
      expect(getComputedStyle(el).overflow).toBe('clip');
    }
    resize.finish();
    expect(getComputedStyle(el).overflow).not.toBe('clip');
  }

  for (const [from, to, outcome] of [
    ['Send offline', 'Not sent', 'fail'],
    ['Send', 'Sent to the whole team', 'succeed'],
  ] as const) {
    it(`keeps "${to}" on one line while the width moves, and "${from}" on the way back (${outcome})`, async () => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
      try {
        const el = await fixture<KtButton>(
          `<kt-button icon="send" done-label="${to}" failed-label="${to}">${from}</kt-button>`,
        );
        await new Promise((resolve) => requestAnimationFrame(resolve));
        await el
          .run(() =>
            outcome === 'fail' ? Promise.reject(new Error('offline')) : Promise.resolve(),
          )
          .catch(() => undefined);
        await settle(el);
        expectOneLine(el, () => el.shadowRoot!.querySelector('button > span')!);

        // Back to rest: the longer label returns into the narrower button.
        await vi.advanceTimersByTimeAsync(2000);
        await settle(el);
        expectOneLine(el, () => el);
      } finally {
        vi.useRealTimers();
      }
    });
  }

  it('keeps its width when only the icon changes — no shrink while the new one draws', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    try {
      const el = await fixture<KtButton>('<kt-button icon="send">Send</kt-button>');
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const width = el.getBoundingClientRect().width;
      const widths: number[] = [];
      let on = true;
      const watch = () => {
        widths.push(el.getBoundingClientRect().width);
        if (on) requestAnimationFrame(watch);
      };
      watch();
      await el.run(() => Promise.resolve());
      await settle(el);
      expect(played(el).has('kt-button-resize')).toBe(false);
      await vi.advanceTimersByTimeAsync(2000);
      await settle(el);
      expect(played(el).has('kt-button-resize')).toBe(false);
      await new Promise((resolve) => requestAnimationFrame(resolve));
      on = false;
      for (const seen of widths) expect(Math.abs(seen - width)).toBeLessThanOrEqual(0.5);
    } finally {
      vi.useRealTimers();
    }
  });

  it('moves to the width the new label and icon end at, not short of it', async () => {
    const el = await fixture<KtButton>(
      '<kt-button icon="send" done-label="Sent to the team">Send</kt-button>',
    );
    await new Promise((resolve) => requestAnimationFrame(resolve));
    await el.run(() => Promise.resolve());
    await settle(el);
    const resize = played(el).get('kt-button-resize')!;
    const target = parseFloat(
      String((resize.effect as KeyframeEffect).getKeyframes().at(-1)!.width),
    );
    resize.finish();
    expect(Math.abs(el.getBoundingClientRect().width - target)).toBeLessThanOrEqual(0.5);
  });
});
