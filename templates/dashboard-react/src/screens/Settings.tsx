/**
 * Settings, as five screens rather than one long scroll: a form, a table of
 * people, a table of capabilities, a list of switches, and a page that is
 * mostly about keeping people out.
 */
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { toaster, type KtInput } from 'kanto-ds';
import { capabilityCell, capabilityRows, memberCell } from '../cells';
import {
  listMembers,
  listSessions,
  removeMember,
  revokeSession,
  type Member,
  type Role,
  type Session,
} from '../data/api';
import {
  NOTIFICATION_GROUPS,
  REGION_OPTIONS,
  ROLE_ICONS,
  ROLES,
  WORKSPACE,
} from '../data/fixtures';
import { Screen, SectionHeader, TileCard } from '../parts';

function SettingsScreen({
  name,
  heading,
  description,
  children,
}: {
  name: string;
  heading: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Screen name={name}>
      <kt-page-header eyebrow="Settings" heading={heading} description={description} />
      {children}
    </Screen>
  );
}

// === General ===

export function General() {
  const name = useRef<KtInput>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const save = (event: FormEvent) => {
    event.preventDefault();
    if (!name.current?.value.trim()) {
      setError('The workspace needs a name.');
      return;
    }
    setError('');
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toaster.success('Workspace updated');
    }, 800);
  };

  return (
    <SettingsScreen
      name="general"
      heading="General"
      description="The name, the address and the defaults everything else inherits."
    >
      <form className="settings-grid" noValidate onSubmit={save}>
        <kt-form
          heading="Workspace"
          description="How this workspace appears to everyone in it."
          disabled={saving}
        >
          <kt-label-input label="Name" required>
            <kt-input ref={name} name="name" value={WORKSPACE.name} required error={error} />
          </kt-label-input>
          <kt-label-input label="Workspace URL">
            <kt-input name="slug" value="northwind" />
          </kt-label-input>
          <kt-label-input label="Description">
            <kt-textarea name="about" rows={3} maxlength={180} />
          </kt-label-input>
          <kt-label-input label="Logo">
            <kt-drag-drop accept="image/*" recommendedSize="256×256px" />
          </kt-label-input>
          <kt-button slot="footer" variant="dark" type="reset">
            Reset
          </kt-button>
          <kt-button slot="footer" type="submit">
            {saving ? 'Saving…' : 'Save changes'}
          </kt-button>
        </kt-form>

        <div className="stack">
          <kt-form heading="Region" description="Where this workspace's data lives.">
            <kt-label-input label="Data residency">
              <kt-select name="region" options={REGION_OPTIONS} value="eu" clearable={false} />
            </kt-label-input>
            <kt-alert
              variant="warning"
              description="Moving a workspace between regions takes up to 24 hours and cannot be reversed."
            />
          </kt-form>
          <kt-form heading="Danger zone">
            <kt-alert
              variant="danger"
              heading="Delete this workspace"
              description="Everything in it goes: customers, orders, history."
            >
              <kt-button
                slot="actions"
                variant="delete"
                size="small"
                onClick={() => setConfirming(true)}
              >
                Delete workspace
              </kt-button>
            </kt-alert>
          </kt-form>
        </div>
      </form>

      <kt-confirm-dialog
        open={confirming}
        heading={`Delete ${WORKSPACE.name}?`}
        message="Everything in it goes: customers, orders, history. This cannot be undone."
        confirmLabel="Delete workspace"
        variant="danger"
        onkt-confirm={() => {
          setConfirming(false);
          toaster.info('Deleting a workspace goes to your backend: see src/data/api.ts.');
        }}
        onkt-cancel={() => setConfirming(false)}
      />
    </SettingsScreen>
  );
}

// === People ===

const MEMBER_COLUMNS = [
  { key: 'name', label: 'Person', sortable: true },
  { key: 'role', label: 'Role', sortable: true, width: '140px' },
  { key: 'seen', label: 'Last seen', width: '140px' },
  { key: 'actions', label: '', width: '60px', align: 'right' as const },
];

export function People() {
  const [members, setMembers] = useState<readonly Member[] | null>(null);
  const [removing, setRemoving] = useState<Member | null>(null);
  // Built once: the table redraws every cell when its renderer changes.
  const [renderMember] = useState(() => memberCell(setRemoving));

  useEffect(() => {
    let live = true;
    void listMembers().then((loaded) => {
      if (live) setMembers(loaded);
    });
    return () => {
      live = false;
    };
  }, []);

  return (
    <SettingsScreen
      name="people"
      heading="People"
      description="Who is in this workspace, and when each of them was last here."
    >
      <kt-card>
        <div slot="header" className="row between card-head">
          <h2 className="card-title">People with access</h2>
          <kt-button
            size="small"
            icon="plus"
            onClick={() =>
              toaster.info('Invitations go out from your backend: see src/data/api.ts.')
            }
          >
            Invite
          </kt-button>
        </div>
        <kt-table
          label="Members"
          loading={members === null}
          columns={MEMBER_COLUMNS}
          data={members ?? []}
          renderCell={renderMember}
        />
      </kt-card>

      <kt-confirm-dialog
        open={removing !== null}
        heading={`Remove ${removing?.name ?? ''}?`}
        message="They lose access at once."
        confirmLabel="Remove"
        variant="danger"
        onkt-confirm={() => {
          const member = removing;
          setRemoving(null);
          if (!member) return;
          void removeMember(member.id).then(async () => {
            setMembers(await listMembers());
            toaster.success(`${member.name} removed`);
          });
        }}
        onkt-cancel={() => setRemoving(null)}
      />
    </SettingsScreen>
  );
}

// === Roles ===

const ROLE_TONES: Record<Role, 'violet' | 'blue' | 'green' | 'amber'> = {
  Owner: 'violet',
  Admin: 'blue',
  Member: 'green',
  Viewer: 'amber',
};

const CAPABILITY_COLUMNS = [
  { key: 'capability', label: 'Capability' },
  ...ROLES.map((role) => ({ key: role, label: role, width: '110px', align: 'center' as const })),
];

const CAPABILITY_ROWS = capabilityRows(ROLES);

export function Roles() {
  const [members, setMembers] = useState<readonly Member[]>([]);

  useEffect(() => {
    let live = true;
    void listMembers().then((loaded) => {
      if (live) setMembers(loaded);
    });
    return () => {
      live = false;
    };
  }, []);

  return (
    <SettingsScreen
      name="roles"
      heading="Roles"
      description="What each role can reach. Who has which is set on the People screen."
    >
      <kt-alert
        variant="neutral"
        icon="info"
        description="Roles are fixed on this plan. Custom roles come with Enterprise."
      />
      <kt-card>
        <div slot="header" className="card-head">
          <SectionHeader heading="What each role can do" />
        </div>
        <kt-table
          label="Capabilities by role"
          compact
          columns={CAPABILITY_COLUMNS}
          data={CAPABILITY_ROWS}
          renderCell={capabilityCell}
        />
      </kt-card>
      <div className="tile-row">
        {members.length > 0
          ? ROLES.map((role) => (
              <TileCard
                key={role}
                tile={{
                  label: role,
                  value: String(members.filter((member) => member.role === role).length),
                  icon: ROLE_ICONS[role],
                  tone: ROLE_TONES[role],
                }}
              />
            ))
          : null}
      </div>
    </SettingsScreen>
  );
}

// === Notifications ===

// Kept while the reader moves between screens.
const switches: Record<string, boolean> = Object.fromEntries(
  NOTIFICATION_GROUPS.flatMap((group) => group.items.map((item) => [item.key, item.on])),
);

export function Notifications() {
  const [on, setOn] = useState(switches);

  return (
    <SettingsScreen
      name="notifications"
      heading="Notifications"
      description="What the workspace tells you about."
    >
      <div className="settings-narrow">
        {NOTIFICATION_GROUPS.map((group) => (
          <kt-form key={group.heading} heading={group.heading} description={group.description}>
            {group.items.map((item) => (
              <div key={item.key} className="setting-row">
                <div className="stack tight">
                  <span>{item.label}</span>
                  {item.hint ? <span className="muted small">{item.hint}</span> : null}
                </div>
                <kt-toggle
                  label={item.label}
                  checked={on[item.key] ?? false}
                  disabled={item.locked === true}
                  onkt-change={(event) => {
                    const checked = event.detail.checked;
                    switches[item.key] = checked;
                    setOn({ ...switches });
                    toaster.info(`${item.label}: ${checked ? 'on' : 'off'}`);
                  }}
                />
              </div>
            ))}
          </kt-form>
        ))}
      </div>
    </SettingsScreen>
  );
}

// === Security ===

/** How far a password is from good enough, out of 100: length, then variety. */
function strength(password: string): number {
  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((kind) => kind.test(password));
  return Math.min(100, password.length * 5 + kinds.length * 10);
}

export function Security() {
  const current = useRef<KtInput>(null);
  const next = useRef<KtInput>(null);
  const [errors, setErrors] = useState({ current: '', next: '' });
  const [score, setScore] = useState(0);
  const [sessions, setSessions] = useState<readonly Session[]>([]);

  useEffect(() => {
    let live = true;
    void listSessions().then((loaded) => {
      if (live) setSessions(loaded);
    });
    return () => {
      live = false;
    };
  }, []);

  const update = (event: FormEvent) => {
    event.preventDefault();
    const found = {
      current: current.current?.value ? '' : 'Enter your current password.',
      next: (next.current?.value.length ?? 0) >= 12 ? '' : 'Use at least 12 characters.',
    };
    setErrors(found);
    if (found.current || found.next) return;
    if (current.current) current.current.value = '';
    if (next.current) next.current.value = '';
    setScore(0);
    toaster.success('Password updated');
  };

  return (
    <SettingsScreen
      name="security"
      heading="Security"
      description="Your password, two-factor authentication, and where you are signed in."
    >
      <div className="settings-narrow">
        <form noValidate onSubmit={update}>
          <kt-form heading="Password">
            <kt-label-input label="Current password" required>
              <kt-input
                ref={current}
                type="password"
                name="current"
                autocomplete="current-password"
                error={errors.current}
              />
            </kt-label-input>
            <kt-label-input label="New password" required>
              <kt-input
                ref={next}
                type="password"
                name="next"
                autocomplete="new-password"
                placeholder="At least 12 characters"
                error={errors.next}
                onkt-input={(event) => setScore(strength(event.detail.value))}
              />
            </kt-label-input>
            <kt-progress-bar
              value={score}
              variant="success"
              size="small"
              label="Password strength"
            />
            <kt-button slot="footer" type="submit">
              Update password
            </kt-button>
          </kt-form>
        </form>

        <kt-form heading="Two-factor authentication">
          <kt-alert
            variant="success"
            heading="On"
            description="With an authenticator app since 14 June 2026."
          >
            <kt-button
              slot="actions"
              size="small"
              variant="dark"
              onClick={() => toaster.info('Recovery codes come from your auth provider.')}
            >
              View recovery codes
            </kt-button>
          </kt-alert>
        </kt-form>

        <kt-form heading="Sessions" description="Devices signed in to your account.">
          <div className="stack">
            {sessions.map((session) => (
              <div key={session.id} className="setting-row">
                <div className="stack tight">
                  <span className="row">
                    {session.device}
                    {session.current ? (
                      <kt-badge tone="success" size="small">
                        This device
                      </kt-badge>
                    ) : null}
                  </span>
                  <span className="muted small">{session.where}</span>
                </div>
                {session.current ? null : (
                  <kt-button
                    size="small"
                    variant="danger"
                    onClick={() => {
                      void revokeSession(session.id).then(async () => {
                        setSessions(await listSessions());
                        toaster.success(`${session.device} signed out`);
                      });
                    }}
                  >
                    Sign out
                  </kt-button>
                )}
              </div>
            ))}
          </div>
        </kt-form>
      </div>
    </SettingsScreen>
  );
}
