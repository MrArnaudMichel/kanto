/** Integrations: a grid of things that are on or off, each saying why it is there. */
import { useEffect, useState } from 'react';
import { toaster } from 'kanto-ds';
import { listIntegrations, setIntegration, type Integration } from '../data/api';
import { Screen } from '../parts';

export function Integrations() {
  const [all, setAll] = useState<readonly Integration[]>([]);
  const [open, setOpen] = useState<Integration | null>(null);

  useEffect(() => {
    let live = true;
    void listIntegrations().then((loaded) => {
      if (live) setAll(loaded);
    });
    return () => {
      live = false;
    };
  }, []);

  const connect = (entry: Integration, connected: boolean) => {
    void setIntegration(entry.id, connected).then(async () => {
      setAll(await listIntegrations());
      if (connected) toaster.success(`${entry.name} connected`);
      else toaster.info(`${entry.name} disconnected`);
    });
  };

  const on = all.filter((entry) => entry.connected).length;

  return (
    <Screen name="integrations">
      <kt-page-header
        eyebrow="System"
        heading="Integrations"
        description="What this workspace is wired to."
      >
        <kt-button
          slot="actions"
          variant="dark"
          icon="book-open"
          onClick={() =>
            toaster.info('Point this at your own API reference: see src/screens/Integrations.tsx.')
          }
        >
          Read the API docs
        </kt-button>
      </kt-page-header>

      <kt-alert
        variant="info"
        heading={`${on} of ${all.length} connected`}
        description="Turning one off stops its traffic; its history stays."
      />

      <div className="integration-grid">
        {all.map((entry) => (
          <kt-card key={entry.id}>
            <div slot="header" className="row between card-head">
              <span className={`tile-icon ${entry.tone}`}>
                <kt-icon name={entry.icon} size={18} />
              </span>
              <kt-badge tone={entry.connected ? 'success' : 'neutral'}>
                {entry.connected ? 'Connected' : 'Off'}
              </kt-badge>
            </div>
            <h3 className="integration-name">{entry.name}</h3>
            <span className="muted small">{entry.note}</span>
            <p className="muted">{entry.detail}</p>
            <div slot="footer" className="row between card-head">
              <kt-button variant="text" size="small" onClick={() => setOpen(entry)}>
                Configure
              </kt-button>
              <kt-toggle
                size="small"
                label={`Connect ${entry.name}`}
                checked={entry.connected}
                onkt-change={(event) => connect(entry, event.detail.checked)}
              />
            </div>
          </kt-card>
        ))}
      </div>

      <kt-side-panel
        eyebrow={open?.category ?? ''}
        heading={open?.name ?? ''}
        open={open !== null}
        onkt-close={() => setOpen(null)}
      >
        {open ? (
          <>
            <p className="muted">{open.detail}</p>
            <kt-form heading="Connection" description="Where the console reaches it.">
              <kt-label-input label="Endpoint">
                <kt-input value={`https://api.${open.id}.example/v2`} readonly />
              </kt-label-input>
              <kt-label-input label="Signing secret">
                <kt-input type="password" value="whsec_0000000000" readonly />
              </kt-label-input>
            </kt-form>
          </>
        ) : null}
        <div slot="footer" className="row end">
          <kt-button variant="dark" onClick={() => setOpen(null)}>
            Close
          </kt-button>
          <kt-button
            onClick={() => {
              if (open) toaster.success(`${open.name} saved`);
              setOpen(null);
            }}
          >
            Save
          </kt-button>
        </div>
      </kt-side-panel>
    </Screen>
  );
}
