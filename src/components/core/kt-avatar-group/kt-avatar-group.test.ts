import { describe, expect, it } from 'vitest';
import { fixture, settle } from '#test/fixture';
import './kt-avatar-group.js';
import type { KtAvatarGroup, KtAvatarGroupPerson } from 'kanto-ds';

const PEOPLE = [
  'Dana Whitfield',
  'Hank Scorpio',
  'Bill Lumbergh',
  'Gavin Belson',
  'Alice Abernathy',
  'Ron Swanson',
].map((name) => ({ name }));

async function mount(
  markup = '<kt-avatar-group label="Team"></kt-avatar-group>',
  people: KtAvatarGroupPerson[] = PEOPLE,
) {
  const el = await fixture<KtAvatarGroup>(markup);
  el.people = people;
  await settle(el);
  return el;
}
const avatars = (el: KtAvatarGroup) => [...el.shadowRoot!.querySelectorAll('kt-avatar')];
const more = (el: KtAvatarGroup) => el.shadowRoot!.querySelector('.more');

describe('kt-avatar-group', () => {
  it('is a named list of the people in it', async () => {
    const el = await mount();
    const list = el.shadowRoot!.querySelector('ul')!;
    expect(list.getAttribute('aria-label')).toBe('Team');
    expect(avatars(el).map((avatar) => avatar.getAttribute('name'))).toEqual(
      PEOPLE.slice(0, 4).map((p) => p.name),
    );
  });

  it('sums up the rest past max, as +N, said as "N more"', async () => {
    const el = await mount();
    expect(more(el)!.textContent!.trim()).toBe('+2');
    expect(more(el)!.getAttribute('aria-label')).toBe('2 more');
  });

  it('shows everyone, and no sum, when they fit', async () => {
    const el = await mount('<kt-avatar-group max="10"></kt-avatar-group>');
    expect(avatars(el)).toHaveLength(6);
    expect(more(el)).toBeNull();
  });

  it('passes its size and pictures to each avatar', async () => {
    const el = await mount('<kt-avatar-group size="large"></kt-avatar-group>', [
      { name: 'Dana Whitfield', src: '/dana.png' },
    ]);
    expect(avatars(el)[0]!.getAttribute('size')).toBe('large');
    expect(avatars(el)[0]!.getAttribute('src')).toBe('/dana.png');
  });

  it('draws nothing for nobody', async () => {
    const el = await mount('<kt-avatar-group></kt-avatar-group>', []);
    expect(el.shadowRoot!.querySelectorAll('li')).toHaveLength(0);
  });
});
