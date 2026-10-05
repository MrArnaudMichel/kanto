/** The audit log, one day at a time. */
import { listEvents, type AuditEvent, type EventKind } from '../data/api';
import { EVENT_FILTERS } from '../data/fixtures';
import { button, el, icon, pageHeader, screen, sectionHeader } from '../dom';
import { eventsByDay } from '../views';
import { toaster } from 'kanto-ds';

let kind: EventKind | 'all' = 'all';

export function activity(outlet: HTMLElement): () => void {
  let live = true;
  let events: readonly AuditEvent[] = [];

  const group = el<HTMLElement & { value: string | null }>('kt-toggle-button-group', {
    label: 'Filter by kind',
  });
  group.append(
    ...EVENT_FILTERS.map((option) =>
      el('kt-toggle-button', { value: option.value }, [option.label]),
    ),
  );
  group.value = kind;
  group.addEventListener('kt-change', (event) => {
    const value = (event as CustomEvent<{ value: string | null }>).detail.value;
    // The chosen filter pressed again would leave none: everything, then.
    kind = (value as EventKind | null) ?? 'all';
    group.value = kind;
    draw();
  });

  const shownCount = el('span', { class: 'muted small' });
  const days = el('div', { class: 'stack days' });

  function draw(): void {
    const grouped = eventsByDay(events, kind);
    const total = grouped.reduce((sum, day) => sum + day.events.length, 0);
    shownCount.textContent = `${total} ${total === 1 ? 'event' : 'events'}`;
    if (grouped.length === 0) {
      days.replaceChildren(
        el('kt-card', {}, [
          el(
            'kt-empty-state',
            {
              icon: 'activity',
              heading: 'Nothing of that kind',
              description: 'Nothing has happened under this heading in the period kept.',
            },
            [
              button('Show everything', { slot: 'actions', variant: 'dark' }, () => {
                kind = 'all';
                group.value = kind;
                draw();
              }),
            ],
          ),
        ]),
      );
      return;
    }
    days.replaceChildren(
      ...grouped.map((day) =>
        el('section', { class: 'stack' }, [
          sectionHeader(day.day),
          el('kt-card', {}, [
            el(
              'kt-timeline',
              {},
              day.events.map((event) =>
                el(
                  'kt-timeline-item',
                  {
                    heading: event.heading,
                    time: event.time,
                    icon: event.icon,
                    variant: event.variant,
                  },
                  [
                    event.body,
                    el('span', { class: 'event-actor' }, [icon('user', 12), event.actor]),
                  ],
                ),
              ),
            ),
          ]),
        ]),
      ),
    );
  }

  outlet.append(
    screen('activity', [
      pageHeader(
        'System',
        'Activity',
        'Everything that happened in this workspace, newest first. Kept for 400 days.',
        [
          button('Export log', { variant: 'dark', icon: 'download' }, () =>
            toaster.info('Export started: the file will be in Files.'),
          ),
        ],
      ),
      el('kt-card', { class: 'toolbar-card' }, [
        el('div', { class: 'toolbar' }, [group, el('span', { class: 'grow' }), shownCount]),
      ]),
      days,
    ]),
  );
  void listEvents().then((loaded) => {
    if (!live) return;
    events = loaded;
    draw();
  });
  return () => {
    live = false;
  };
}
