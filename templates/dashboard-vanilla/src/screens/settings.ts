/**
 * Settings, as five screens rather than one long scroll: a form, a table of
 * people, a table of capabilities, a list of switches, and a page that is
 * mostly about keeping people out.
 */
import {
  toaster,
  type KtConfirmDialog,
  type KtInput,
  type KtSelect,
  type KtTable,
  type KtToggle,
} from 'kanto-ds';
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
import { button, el, pageHeader, screen, sectionHeader, tile } from '../dom';

const header = (heading: string, description: string) =>
  pageHeader('Settings', heading, description);

// === General ===

export function general(outlet: HTMLElement): void {
  const name = el<KtInput>('kt-input', { name: 'name', value: WORKSPACE.name, required: true });
  const slug = el<KtInput>('kt-input', { name: 'slug', value: 'northwind' });
  const save = el('kt-button', { slot: 'footer', type: 'submit' }, ['Save changes']);
  const region = el<KtSelect>('kt-select', { name: 'region' });
  region.options = REGION_OPTIONS;
  region.value = 'eu';
  region.clearable = false;

  const workspace = el(
    'kt-form',
    {
      heading: 'Workspace',
      description: 'How this workspace appears to everyone in it.',
    },
    [
      el('kt-label-input', { label: 'Name', required: true }, [name]),
      el('kt-label-input', { label: 'Workspace URL' }, [slug]),
      el('kt-label-input', { label: 'Description' }, [
        el('kt-textarea', { name: 'about', rows: 3, maxlength: 180 }),
      ]),
      el('kt-label-input', { label: 'Logo' }, [
        el('kt-drag-drop', { accept: 'image/*', 'recommended-size': '256×256px' }),
      ]),
      el('kt-button', { slot: 'footer', variant: 'dark', type: 'reset' }, ['Reset']),
      save,
    ],
  );

  const confirm = el<KtConfirmDialog>('kt-confirm-dialog', {
    heading: `Delete ${WORKSPACE.name}?`,
    message: 'Everything in it goes: customers, orders, history. This cannot be undone.',
    'confirm-label': 'Delete workspace',
    variant: 'danger',
  });
  confirm.addEventListener('kt-confirm', () => {
    confirm.open = false;
    toaster.info('Deleting a workspace goes to your backend: see src/data/api.ts.');
  });
  confirm.addEventListener('kt-cancel', () => {
    confirm.open = false;
  });

  const form = el('form', { class: 'settings-grid', novalidate: true }, [
    workspace,
    el('div', { class: 'stack' }, [
      el('kt-form', { heading: 'Region', description: "Where this workspace's data lives." }, [
        el('kt-label-input', { label: 'Data residency' }, [region]),
        el('kt-alert', {
          variant: 'warning',
          description:
            'Moving a workspace between regions takes up to 24 hours and cannot be reversed.',
        }),
      ]),
      el('kt-form', { heading: 'Danger zone' }, [
        el(
          'kt-alert',
          {
            variant: 'danger',
            heading: 'Delete this workspace',
            description: 'Everything in it goes: customers, orders, history.',
          },
          [
            button(
              'Delete workspace',
              { slot: 'actions', variant: 'delete', size: 'small' },
              () => {
                confirm.open = true;
              },
            ),
          ],
        ),
      ]),
    ]),
  ]);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    name.error = name.value.trim() ? '' : 'The workspace needs a name.';
    if (name.error) return;
    workspace.toggleAttribute('disabled', true);
    save.textContent = 'Saving…';
    setTimeout(() => {
      workspace.toggleAttribute('disabled', false);
      save.textContent = 'Save changes';
      toaster.success('Workspace updated');
    }, 800);
  });

  outlet.append(
    screen('general', [
      header('General', 'The name, the address and the defaults everything else inherits.'),
      form,
      confirm,
    ]),
  );
}

// === People ===

const MEMBER_COLUMNS = [
  { key: 'name', label: 'Person', sortable: true },
  { key: 'role', label: 'Role', sortable: true, width: '140px' },
  { key: 'seen', label: 'Last seen', width: '140px' },
  { key: 'actions', label: '', width: '60px', align: 'right' as const },
];

export function people(outlet: HTMLElement): () => void {
  let live = true;
  let removing: Member | undefined;

  const confirm = el<KtConfirmDialog>('kt-confirm-dialog', {
    message: 'They lose access at once.',
    'confirm-label': 'Remove',
    variant: 'danger',
  });
  confirm.addEventListener('kt-confirm', () => {
    const member = removing;
    confirm.open = false;
    if (!member) return;
    void removeMember(member.id).then(async () => {
      toaster.success(`${member.name} removed`);
      const left = await listMembers();
      if (live) table.data = left;
    });
  });
  confirm.addEventListener('kt-cancel', () => {
    confirm.open = false;
  });

  const table = el<KtTable>('kt-table', { label: 'Members' });
  table.columns = MEMBER_COLUMNS;
  table.loading = true;
  table.renderCell = memberCell((member) => {
    removing = member;
    confirm.heading = `Remove ${member.name}?`;
    confirm.open = true;
  });

  outlet.append(
    screen('people', [
      header('People', 'Who is in this workspace, and when each of them was last here.'),
      el('kt-card', {}, [
        el('div', { slot: 'header', class: 'row between card-head' }, [
          el('h2', { class: 'card-title' }, ['People with access']),
          button('Invite', { size: 'small', icon: 'plus' }, () =>
            toaster.info('Invitations go out from your backend: see src/data/api.ts.'),
          ),
        ]),
        table,
      ]),
      confirm,
    ]),
  );
  void listMembers().then((members) => {
    if (!live) return;
    table.data = members;
    table.loading = false;
  });
  return () => {
    live = false;
  };
}

// === Roles ===

const ROLE_TONES: Record<Role, 'violet' | 'blue' | 'green' | 'amber'> = {
  Owner: 'violet',
  Admin: 'blue',
  Member: 'green',
  Viewer: 'amber',
};

export function roles(outlet: HTMLElement): () => void {
  let live = true;
  const table = el<KtTable>('kt-table', { label: 'Capabilities by role', compact: true });
  table.columns = [
    { key: 'capability', label: 'Capability' },
    ...ROLES.map((role) => ({
      key: role,
      label: role,
      width: '110px',
      align: 'center' as const,
    })),
  ];
  table.data = capabilityRows(ROLES);
  table.renderCell = capabilityCell;

  const counts = el('div', { class: 'tile-row' });

  outlet.append(
    screen('roles', [
      header('Roles', 'What each role can reach. Who has which is set on the People screen.'),
      el('kt-alert', {
        variant: 'neutral',
        icon: 'info',
        description: 'Roles are fixed on this plan. Custom roles come with Enterprise.',
      }),
      el('kt-card', {}, [
        el('div', { slot: 'header', class: 'card-head' }, [sectionHeader('What each role can do')]),
        table,
      ]),
      counts,
    ]),
  );
  void listMembers().then((members) => {
    if (!live) return;
    counts.replaceChildren(
      ...ROLES.map((role) =>
        tile({
          label: role,
          value: String(members.filter((member) => member.role === role).length),
          icon: ROLE_ICONS[role],
          tone: ROLE_TONES[role],
        }),
      ),
    );
  });
  return () => {
    live = false;
  };
}

// === Notifications ===

const switches = new Map(
  NOTIFICATION_GROUPS.flatMap((group) => group.items.map((item) => [item.key, item.on] as const)),
);

export function notifications(outlet: HTMLElement): void {
  outlet.append(
    screen('notifications', [
      header('Notifications', 'What the workspace tells you about.'),
      el(
        'div',
        { class: 'settings-narrow' },
        NOTIFICATION_GROUPS.map((group) =>
          el(
            'kt-form',
            { heading: group.heading, description: group.description },
            group.items.map((item) => {
              const toggle = el<KtToggle>('kt-toggle', {
                label: item.label,
                disabled: item.locked === true,
              });
              toggle.checked = switches.get(item.key) ?? false;
              toggle.addEventListener('kt-change', (event) => {
                const on = (event as CustomEvent<{ checked: boolean }>).detail.checked;
                switches.set(item.key, on);
                toaster.info(`${item.label}: ${on ? 'on' : 'off'}`);
              });
              return el('div', { class: 'setting-row' }, [
                el('div', { class: 'stack tight' }, [
                  el('span', {}, [item.label]),
                  ...(item.hint ? [el('span', { class: 'muted small' }, [item.hint])] : []),
                ]),
                toggle,
              ]);
            }),
          ),
        ),
      ),
    ]),
  );
}

// === Security ===

/** How far a password is from good enough, out of 100: length, then variety. */
function strength(password: string): number {
  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((kind) => kind.test(password));
  return Math.min(100, password.length * 5 + kinds.length * 10);
}

export function security(outlet: HTMLElement): () => void {
  let live = true;

  const current = el<KtInput>('kt-input', {
    type: 'password',
    name: 'current',
    autocomplete: 'current-password',
  });
  const next = el<KtInput>('kt-input', {
    type: 'password',
    name: 'next',
    autocomplete: 'new-password',
    placeholder: 'At least 12 characters',
  });
  const meter = el('kt-progress-bar', {
    value: 0,
    variant: 'success',
    size: 'small',
    label: 'Password strength',
  });
  next.addEventListener('kt-input', () => {
    meter.setAttribute('value', String(strength(next.value)));
  });
  const password = el('form', { novalidate: true }, [
    el('kt-form', { heading: 'Password' }, [
      el('kt-label-input', { label: 'Current password', required: true }, [current]),
      el('kt-label-input', { label: 'New password', required: true }, [next]),
      meter,
      el('kt-button', { slot: 'footer', type: 'submit' }, ['Update password']),
    ]),
  ]);
  password.addEventListener('submit', (event) => {
    event.preventDefault();
    current.error = current.value ? '' : 'Enter your current password.';
    next.error = next.value.length >= 12 ? '' : 'Use at least 12 characters.';
    if (current.error || next.error) return;
    current.value = '';
    next.value = '';
    meter.setAttribute('value', '0');
    toaster.success('Password updated');
  });

  const sessions = el('div', { class: 'stack' });
  const drawSessions = (list: readonly Session[]) => {
    sessions.replaceChildren(
      ...list.map((session) =>
        el('div', { class: 'setting-row' }, [
          el('div', { class: 'stack tight' }, [
            el('span', { class: 'row' }, [
              session.device,
              ...(session.current
                ? [el('kt-badge', { tone: 'success', size: 'small' }, ['This device'])]
                : []),
            ]),
            el('span', { class: 'muted small' }, [session.where]),
          ]),
          ...(session.current
            ? []
            : [
                button('Sign out', { size: 'small', variant: 'danger' }, () => {
                  void revokeSession(session.id).then(async () => {
                    toaster.success(`${session.device} signed out`);
                    const left = await listSessions();
                    if (live) drawSessions(left);
                  });
                }),
              ]),
        ]),
      ),
    );
  };

  outlet.append(
    screen('security', [
      header('Security', 'Your password, two-factor authentication, and where you are signed in.'),
      el('div', { class: 'settings-narrow' }, [
        password,
        el('kt-form', { heading: 'Two-factor authentication' }, [
          el(
            'kt-alert',
            {
              variant: 'success',
              heading: 'On',
              description: 'With an authenticator app since 14 June 2026.',
            },
            [
              button(
                'View recovery codes',
                { slot: 'actions', size: 'small', variant: 'dark' },
                () => toaster.info('Recovery codes come from your auth provider.'),
              ),
            ],
          ),
        ]),
        el('kt-form', { heading: 'Sessions', description: 'Devices signed in to your account.' }, [
          sessions,
        ]),
      ]),
    ]),
  );
  void listSessions().then((list) => {
    if (live) drawSessions(list);
  });
  return () => {
    live = false;
  };
}
