import type { KtButton, KtConfirmDialog, KtInput } from 'kanto-ds';
import { currentSession, signOut, updateSession } from '../auth';
import { saveProfile } from '../data/api';
import { navigate } from '../router';

export function settingsPage(page: HTMLElement): void {
  page.innerHTML = `
    <kt-page-header heading="Settings" description="Your profile, what we email you about, and your workspace."></kt-page-header>
    <div class="settings">
      <kt-settings-section heading="Profile" description="The name and email on every invoice you send.">
        <kt-label-input label="Name"><kt-input name="name" autocomplete="name"></kt-input></kt-label-input>
        <kt-label-input label="Email"><kt-input name="email" type="email" autocomplete="email"></kt-input></kt-label-input>
        <kt-button slot="actions" class="save-profile" done-label="Saved">Save</kt-button>
      </kt-settings-section>
      <kt-settings-section heading="Notifications" description="What we email you about, and when.">
        <kt-toggle checked>Email me when an invoice is paid</kt-toggle>
        <kt-toggle>Email me a weekly summary</kt-toggle>
        <kt-button slot="actions" class="save-notifications" done-label="Saved">Save</kt-button>
      </kt-settings-section>
      <kt-settings-section danger heading="Delete workspace" description="Every invoice, customer and file in it goes, for good.">
        <kt-button slot="actions" class="delete" variant="delete">Delete workspace</kt-button>
      </kt-settings-section>
    </div>
    <kt-confirm-dialog heading="Delete this workspace?" message="Everything in it goes, for good. This cannot be undone." confirm-label="Delete workspace"></kt-confirm-dialog>`;

  const session = currentSession();
  const name = page.querySelector<KtInput>('kt-input[name="name"]')!;
  const email = page.querySelector<KtInput>('kt-input[name="email"]')!;
  name.value = session?.name ?? '';
  email.value = session?.email ?? '';

  const saveButton = page.querySelector<KtButton>('.save-profile')!;
  saveButton.addEventListener('click', () => {
    void saveButton.run(() =>
      saveProfile({ name: name.value, email: email.value }).then(updateSession),
    );
  });
  const notifyButton = page.querySelector<KtButton>('.save-notifications')!;
  notifyButton.addEventListener('click', () => {
    void notifyButton.run(() => new Promise((resolve) => setTimeout(resolve, 400)));
  });

  const dialog = page.querySelector<KtConfirmDialog>('kt-confirm-dialog')!;
  page.querySelector('.delete')!.addEventListener('click', () => (dialog.open = true));
  dialog.addEventListener('kt-cancel', () => (dialog.open = false));
  dialog.addEventListener('kt-confirm', () => {
    signOut();
    navigate('/sign-in');
  });
}
