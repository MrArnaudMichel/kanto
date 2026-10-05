/** Integrations: a grid of things that are on or off, each saying why it is there. */
import { toaster, type KtSidePanel, type KtToggle } from 'kanto-ds';
import { listIntegrations, setIntegration, type Integration } from '../data/api';
import { button, el, icon, pageHeader, screen } from '../dom';

export function integrations(outlet: HTMLElement): () => void {
  let live = true;
  let all: readonly Integration[] = [];

  const summary = el('kt-alert', { variant: 'info' });
  const grid = el('div', { class: 'integration-grid' });
  const panel = el<KtSidePanel>('kt-side-panel');

  function configure(entry: Integration): void {
    panel.eyebrow = entry.category;
    panel.heading = entry.name;
    panel.replaceChildren(
      el('p', { class: 'muted' }, [entry.detail]),
      el('kt-form', { heading: 'Connection', description: 'Where the console reaches it.' }, [
        el('kt-label-input', { label: 'Endpoint' }, [
          el('kt-input', { value: `https://api.${entry.id}.example/v2`, readonly: true }),
        ]),
        el('kt-label-input', { label: 'Signing secret' }, [
          el('kt-input', { type: 'password', value: 'whsec_0000000000', readonly: true }),
        ]),
      ]),
      el('div', { slot: 'footer', class: 'row end' }, [
        button('Close', { variant: 'dark' }, () => {
          panel.open = false;
        }),
        button('Save', {}, () => {
          panel.open = false;
          toaster.success(`${entry.name} saved`);
        }),
      ]),
    );
    panel.open = true;
  }

  function card(entry: Integration): HTMLElement {
    const toggle = el<KtToggle>('kt-toggle', { size: 'small', label: `Connect ${entry.name}` });
    toggle.checked = entry.connected;
    toggle.addEventListener('kt-change', (event) => {
      const connected = (event as CustomEvent<{ checked: boolean }>).detail.checked;
      void setIntegration(entry.id, connected).then(async () => {
        // Said even if the reader has moved on: the change happened.
        if (connected) toaster.success(`${entry.name} connected`);
        else toaster.info(`${entry.name} disconnected`);
        const loaded = await listIntegrations();
        if (!live) return;
        all = loaded;
        draw();
      });
    });
    return el('kt-card', {}, [
      el('div', { slot: 'header', class: 'row between card-head' }, [
        el('span', { class: `tile-icon ${entry.tone}` }, [icon(entry.icon, 18)]),
        el('kt-badge', { tone: entry.connected ? 'success' : 'neutral' }, [
          entry.connected ? 'Connected' : 'Off',
        ]),
      ]),
      el('h3', { class: 'integration-name' }, [entry.name]),
      el('span', { class: 'muted small' }, [entry.note]),
      el('p', { class: 'muted' }, [entry.detail]),
      el('div', { slot: 'footer', class: 'row between card-head' }, [
        button('Configure', { variant: 'text', size: 'small' }, () => configure(entry)),
        toggle,
      ]),
    ]);
  }

  function draw(): void {
    const on = all.filter((entry) => entry.connected).length;
    summary.setAttribute('heading', `${on} of ${all.length} connected`);
    summary.setAttribute('description', 'Turning one off stops its traffic; its history stays.');
    grid.replaceChildren(...all.map(card));
  }

  outlet.append(
    screen('integrations', [
      pageHeader('System', 'Integrations', 'What this workspace is wired to.', [
        button('Read the API docs', { variant: 'dark', icon: 'book-open' }, () =>
          toaster.info('Point this at your own API reference: see src/screens/integrations.ts.'),
        ),
      ]),
      summary,
      grid,
      panel,
    ]),
  );
  void listIntegrations().then((loaded) => {
    if (!live) return;
    all = loaded;
    draw();
  });
  return () => {
    live = false;
  };
}
