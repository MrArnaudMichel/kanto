/**
 * How the tables draw their cells. kt-table asks for a cell as a DOM node,
 * which no framework needs to build: these are the same in every stack. Text
 * goes in as text, never as markup.
 */
import { CAPABILITIES } from './data/fixtures';
import type { Entity, FileRow, Member } from './data/api';
import { formatCents, formatMoney, KIND_COLOR, KIND_ICON, STATUS_COLOR } from './format';

type Cell = (row: Record<string, unknown>, column: { key: string }) => unknown;

function node(
  tag: string,
  attributes: Record<string, string | boolean | undefined> = {},
  children: (Node | string)[] = [],
): HTMLElement {
  const element = document.createElement(tag);
  for (const [name, value] of Object.entries(attributes)) {
    if (value === true) element.setAttribute(name, '');
    else if (typeof value === 'string') element.setAttribute(name, value);
  }
  element.append(...children);
  return element;
}

const statusBadge = (row: Entity) =>
  node('kt-badge', { variant: 'category', color: STATUS_COLOR[row.status] }, [row.status]);

const person = (name: string, detail?: string) =>
  node('span', { class: 'cell-person' }, [
    node('kt-avatar', { name, size: 'small' }),
    detail
      ? node('span', { class: 'stack tight' }, [
          node('span', {}, [name]),
          node('span', { class: 'muted small' }, [detail]),
        ])
      : node('span', {}, [name]),
  ]);

/** A button in a cell: pressing it must not also open the row. */
function cellButton(label: string, icon: string, onPress: () => void, disabled = false) {
  const button = node('kt-button', {
    variant: 'secondary-no-bg',
    size: 'small',
    icon,
    label,
    disabled,
  });
  button.addEventListener('click', (event) => {
    event.stopPropagation();
    onPress();
  });
  return button;
}

/** The overview's latest orders. */
export const orderCell: Cell = (row, column) => {
  const order = row as Entity;
  if (column.key === 'amount') return formatCents(order.amount);
  if (column.key === 'ref') return node('code', {}, [`#${order.ref}`]);
  if (column.key === 'status') return statusBadge(order);
  return undefined;
};

export const customerCell: Cell = (row, column) => {
  const customer = row as Entity;
  if (column.key === 'owner') return person(customer.owner);
  if (column.key === 'amount') return formatMoney(customer.amount);
  if (column.key === 'ref') return node('code', {}, [customer.ref]);
  if (column.key === 'status') return statusBadge(customer);
  return undefined;
};

export const fileCell =
  (onDownload: (file: FileRow) => void): Cell =>
  (row, column) => {
    const file = row as FileRow;
    if (column.key === 'name') {
      return node('span', { class: 'cell-file' }, [
        node('kt-icon', {
          name: KIND_ICON[file.kind],
          size: '16',
          style: `color:${KIND_COLOR[file.kind]}`,
        }),
        node('span', {}, [file.name]),
        ...(file.starred
          ? [
              node('kt-icon', {
                name: 'star',
                size: '13',
                label: 'Starred',
                style: 'color:var(--color-warning-base)',
              }),
            ]
          : []),
      ]);
    }
    if (column.key === 'actions') {
      return cellButton(`Download ${file.name}`, 'download', () => onDownload(file));
    }
    return undefined;
  };

export const memberCell =
  (onRemove: (member: Member) => void): Cell =>
  (row, column) => {
    const member = row as Member;
    if (column.key === 'name') return person(member.name, member.email);
    if (column.key === 'role') {
      return node('kt-badge', { variant: member.role === 'Owner' ? 'primary' : 'neutral' }, [
        member.role,
      ]);
    }
    if (column.key === 'actions') {
      // The owner stays: someone has to.
      return cellButton(
        `Remove ${member.name}`,
        'trash-2',
        () => onRemove(member),
        member.role === 'Owner',
      );
    }
    return undefined;
  };

/** The roles table: a tick or a dash, each with words for a screen reader. */
export const capabilityCell: Cell = (row, column) => {
  if (column.key === 'capability') return undefined;
  return row[column.key]
    ? node('kt-icon', {
        name: 'check',
        size: '16',
        label: 'Allowed',
        style: 'color:var(--color-success-base)',
      })
    : node('kt-icon', {
        name: 'minus',
        size: '16',
        label: 'Not allowed',
        style: 'color:var(--text-disabled)',
      });
};

/** The roles table's rows: one per capability, a column per role. */
export const capabilityRows = (roles: readonly string[]): Record<string, unknown>[] =>
  CAPABILITIES.map(({ capability, allowed }) => ({
    capability,
    ...Object.fromEntries(roles.map((role, index) => [role, allowed[index]])),
  }));
