import type { Template } from './index.js';

export const settings: Template = {
  slug: 'settings',
  name: 'Settings',
  description: 'Profile, notifications and a danger zone, in panels saved by one form.',
  html: `<style>
  .settings {
    display: grid;
    align-content: start;
    gap: 24px;
    max-width: 760px;
    min-height: 100vh;
    margin: 0 auto;
    padding: 32px 24px;
    background: var(--surface-page);
  }
  .settings h1 {
    margin: 0;
    color: var(--text-body);
    font: var(--font-title-h4);
  }
  .settings form {
    display: grid;
    gap: 20px;
  }
  .settings-pair {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 16px;
  }
  .settings-toggles {
    display: grid;
    gap: 12px;
  }
  .settings-save {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }
</style>

<main class="settings">
  <h1>Settings</h1>
  <kt-tabs id="sections"></kt-tabs>

  <form id="settings-form">
    <kt-form heading="Profile" description="How your team sees you.">
      <div class="settings-pair">
        <kt-label-input label="Name" required>
          <kt-input name="name" value="Dana Whitfield" required></kt-input>
        </kt-label-input>
        <kt-label-input label="Email" required>
          <kt-input name="email" type="email" value="dana@northwind.io" required></kt-input>
        </kt-label-input>
      </div>
      <div class="settings-pair">
        <kt-label-input label="Time zone">
          <kt-select name="zone" id="zone"></kt-select>
        </kt-label-input>
        <kt-label-input label="Working hours start">
          <kt-time-input name="start" value="09:00" step="15"></kt-time-input>
        </kt-label-input>
      </div>
    </kt-form>

    <kt-form heading="Notifications" description="What we email you about.">
      <div class="settings-toggles">
        <kt-toggle name="mentions" checked>When someone mentions me</kt-toggle>
        <kt-toggle name="digest" checked>A weekly digest</kt-toggle>
        <kt-toggle name="news">Product news</kt-toggle>
      </div>
    </kt-form>

    <div class="settings-save">
      <kt-button type="reset" variant="secondary">Discard</kt-button>
      <kt-button type="submit" variant="primary">Save changes</kt-button>
    </div>
  </form>

  <kt-alert variant="danger" heading="Delete your account" description="Your workspaces and their data go with it. This cannot be undone.">
    <kt-button slot="actions" size="small" variant="delete" id="delete">Delete account</kt-button>
  </kt-alert>
  <kt-confirm-dialog
    id="confirm"
    heading="Delete your account?"
    description="Everything goes, now and for good."
    confirm-label="Delete"
    variant="danger"
  ></kt-confirm-dialog>
</main>`,
  script: `import { toaster } from 'kanto-ds';

document.querySelector('#sections').tabs = [
  { value: 'general', label: 'General' },
  { value: 'billing', label: 'Billing' },
  { value: 'members', label: 'Members' },
];
document.querySelector('#sections').value = 'general';

document.querySelector('#zone').options = [
  { id: 'Europe/Paris', label: 'Paris (UTC+2)' },
  { id: 'Europe/London', label: 'London (UTC+1)' },
  { id: 'America/New_York', label: 'New York (UTC−4)' },
];
document.querySelector('#zone').value = 'Europe/Paris';

document.querySelector('#settings-form').addEventListener('submit', (event) => {
  event.preventDefault();
  toaster.success('Settings saved');
});

document.querySelector('#delete').addEventListener('click', () => {
  document.querySelector('#confirm').open = true;
});
document.querySelector('#confirm').addEventListener('kt-confirm', () => {
  toaster.error('Account deleted', { description: 'Not really — this is a template.' });
});`,
};
