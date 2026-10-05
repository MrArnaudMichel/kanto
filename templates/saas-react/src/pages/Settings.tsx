import { useRef, useState } from 'react';
import type { KtButton } from 'kanto-ds';
import { useNavigate } from 'react-router';
import { currentSession, signOut, updateSession } from '../auth';
import { saveProfile } from '../data/api';

export function Settings() {
  const navigate = useNavigate();
  const session = currentSession();
  const [name, setName] = useState(session?.name ?? '');
  const [email, setEmail] = useState(session?.email ?? '');
  const [confirming, setConfirming] = useState(false);
  const saveButton = useRef<KtButton>(null);
  const notifyButton = useRef<KtButton>(null);

  return (
    <>
      <kt-page-header
        heading="Settings"
        description="Your profile, what we email you about, and your workspace."
      />
      <div className="settings">
        <kt-settings-section
          heading="Profile"
          description="The name and email on every invoice you send."
        >
          <kt-label-input label="Name">
            <kt-input
              name="name"
              autocomplete="name"
              value={name}
              onkt-input={(event) => setName(event.detail.value)}
            />
          </kt-label-input>
          <kt-label-input label="Email">
            <kt-input
              name="email"
              type="email"
              autocomplete="email"
              value={email}
              onkt-input={(event) => setEmail(event.detail.value)}
            />
          </kt-label-input>
          <kt-button
            slot="actions"
            ref={saveButton}
            doneLabel="Saved"
            onClick={() =>
              void saveButton.current?.run(() => saveProfile({ name, email }).then(updateSession))
            }
          >
            Save
          </kt-button>
        </kt-settings-section>
        <kt-settings-section
          heading="Notifications"
          description="What we email you about, and when."
        >
          <kt-toggle checked>Email me when an invoice is paid</kt-toggle>
          <kt-toggle>Email me a weekly summary</kt-toggle>
          <kt-button
            slot="actions"
            ref={notifyButton}
            doneLabel="Saved"
            onClick={() =>
              void notifyButton.current?.run(
                () => new Promise((resolve) => setTimeout(resolve, 400)),
              )
            }
          >
            Save
          </kt-button>
        </kt-settings-section>
        <kt-settings-section
          danger
          heading="Delete workspace"
          description="Every invoice, customer and file in it goes, for good."
        >
          <kt-button slot="actions" variant="delete" onClick={() => setConfirming(true)}>
            Delete workspace
          </kt-button>
        </kt-settings-section>
      </div>
      <kt-confirm-dialog
        open={confirming}
        heading="Delete this workspace?"
        message="Everything in it goes, for good. This cannot be undone."
        confirmLabel="Delete workspace"
        onkt-cancel={() => setConfirming(false)}
        onkt-confirm={() => {
          signOut();
          navigate('/sign-in');
        }}
      />
    </>
  );
}
