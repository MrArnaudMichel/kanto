import { describe, expect, it } from 'vitest';
import { fixture } from '#test/fixture';
import './kt-timeline.js';
import type { KtTimeline, KtTimelineItem } from 'kanto-ds';

const three = `<kt-timeline>
  <kt-timeline-item heading="Opened" time="09:02"></kt-timeline-item>
  <kt-timeline-item heading="Reviewed" time="09:14" icon="eye" variant="info"></kt-timeline-item>
  <kt-timeline-item heading="Deployed" time="09:24" variant="success">Build 4210.</kt-timeline-item>
</kt-timeline>`;

describe('kt-timeline', () => {
  it('carries list semantics across the shadow boundary', async () => {
    const el = await fixture<KtTimeline>(three);
    expect(el.shadowRoot!.querySelector('[role="list"]')).not.toBeNull();
    for (const item of el.querySelectorAll('kt-timeline-item')) {
      expect(item.getAttribute('role')).toBe('listitem');
    }
  });

  it('marks only the last item, so the rail stops at the last dot', async () => {
    const el = await fixture<KtTimeline>(three);
    const items = [...el.querySelectorAll<KtTimelineItem>('kt-timeline-item')];
    expect(items.map((item) => item.last)).toEqual([false, false, true]);
  });

  it('re-marks after an item is appended', async () => {
    const el = await fixture<KtTimeline>(three);
    const added = document.createElement('kt-timeline-item');
    el.append(added);
    await el.updateComplete;
    await added.updateComplete;

    const items = [...el.querySelectorAll<KtTimelineItem>('kt-timeline-item')];
    expect(items.map((item) => item.last)).toEqual([false, false, false, true]);
  });

  it('passes compact down to its items', async () => {
    const el = await fixture<KtTimeline>(three.replace('<kt-timeline>', '<kt-timeline compact>'));
    for (const item of el.querySelectorAll<KtTimelineItem>('kt-timeline-item')) {
      expect(item.compact).toBe(true);
    }
  });
});

describe('kt-timeline-item', () => {
  it('renders a dot without an icon and an icon with one', async () => {
    const plain = await fixture<KtTimelineItem>(
      '<kt-timeline-item heading="A"></kt-timeline-item>',
    );
    expect(plain.shadowRoot!.querySelector('.marker')!.classList.contains('dot')).toBe(true);
    expect(plain.shadowRoot!.querySelector('kt-icon')).toBeNull();

    const iconic = await fixture<KtTimelineItem>(
      '<kt-timeline-item heading="A" icon="rocket"></kt-timeline-item>',
    );
    expect(iconic.shadowRoot!.querySelector('.marker')!.classList.contains('dot')).toBe(false);
    expect(iconic.shadowRoot!.querySelector('kt-icon')!.getAttribute('name')).toBe('rocket');
  });

  it('drops the heading row when it has neither a heading nor a time', async () => {
    const el = await fixture<KtTimelineItem>('<kt-timeline-item>Just a note.</kt-timeline-item>');
    expect(el.shadowRoot!.querySelector('.top')).toBeNull();
    expect(el.shadowRoot!.querySelector('.body')).not.toBeNull();
  });

  it('reflects the variant onto the marker', async () => {
    const el = await fixture<KtTimelineItem>(
      '<kt-timeline-item heading="A" variant="danger"></kt-timeline-item>',
    );
    expect(el.shadowRoot!.querySelector('.marker')!.classList.contains('danger')).toBe(true);
  });
});
