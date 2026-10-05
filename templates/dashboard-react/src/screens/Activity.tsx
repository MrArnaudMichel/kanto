/** The audit log, one day at a time. */
import { useEffect, useState } from 'react';
import { toaster } from 'kanto-ds';
import { listEvents, type AuditEvent, type EventKind } from '../data/api';
import { EVENT_FILTERS } from '../data/fixtures';
import { Screen, SectionHeader, useKept } from '../parts';
import { eventsByDay } from '../views';

// Kept while the reader is elsewhere.
const kept = { kind: 'all' as EventKind | 'all' };

export function Activity() {
  const [events, setEvents] = useState<readonly AuditEvent[]>([]);
  const [kind, setKind] = useKept(kept, 'kind');

  useEffect(() => {
    let live = true;
    void listEvents().then((loaded) => {
      if (live) setEvents(loaded);
    });
    return () => {
      live = false;
    };
  }, []);

  const days = eventsByDay(events, kind);
  const total = days.reduce((sum, day) => sum + day.events.length, 0);

  return (
    <Screen name="activity">
      <kt-page-header
        eyebrow="System"
        heading="Activity"
        description="Everything that happened in this workspace, newest first. Kept for 400 days."
      >
        <kt-button
          slot="actions"
          variant="dark"
          icon="download"
          onClick={() => toaster.info('Export started: the file will be in Files.')}
        >
          Export log
        </kt-button>
      </kt-page-header>

      <kt-card className="toolbar-card">
        <div className="toolbar">
          <kt-toggle-button-group
            label="Filter by kind"
            value={kind}
            // The chosen filter pressed again would leave none: everything, then.
            onkt-change={(event) => setKind((event.detail.value as EventKind | null) ?? 'all')}
          >
            {EVENT_FILTERS.map((option) => (
              <kt-toggle-button key={option.value} value={option.value}>
                {option.label}
              </kt-toggle-button>
            ))}
          </kt-toggle-button-group>
          <span className="grow" />
          <span className="muted small">{`${total} ${total === 1 ? 'event' : 'events'}`}</span>
        </div>
      </kt-card>

      <div className="stack days">
        {events.length > 0 && days.length === 0 ? (
          <kt-card>
            <kt-empty-state
              icon="activity"
              heading="Nothing of that kind"
              description="Nothing has happened under this heading in the period kept."
            >
              <kt-button slot="actions" variant="dark" onClick={() => setKind('all')}>
                Show everything
              </kt-button>
            </kt-empty-state>
          </kt-card>
        ) : (
          days.map((day) => (
            <section key={day.day} className="stack">
              <SectionHeader heading={day.day} />
              <kt-card>
                <kt-timeline>
                  {day.events.map((event) => (
                    <kt-timeline-item
                      key={event.heading}
                      heading={event.heading}
                      time={event.time}
                      icon={event.icon}
                      variant={event.variant}
                    >
                      {event.body}
                      <span className="event-actor">
                        <kt-icon name="user" size={12} />
                        {event.actor}
                      </span>
                    </kt-timeline-item>
                  ))}
                </kt-timeline>
              </kt-card>
            </section>
          ))
        )}
      </div>
    </Screen>
  );
}
