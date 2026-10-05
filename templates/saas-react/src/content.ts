/** The app's words and structure: its name, its navigation, its first steps, its tables. */
import type { KtFirstStep, KtNavSection, KtTableColumn, KtUserMenuItem } from 'kanto-ds';

export const APP_NAME = 'Northwind';

export const NAV: KtNavSection[] = [
  {
    title: 'Workspace',
    items: [
      { label: 'Overview', href: '#/', icon: 'house' },
      { label: 'Customers', href: '#/customers', icon: 'users' },
      { label: 'Settings', href: '#/settings', icon: 'settings' },
    ],
  },
];

export const USER_MENU: KtUserMenuItem[] = [
  { id: 'settings', label: 'Settings', icon: 'settings' },
  { id: 'sign-out', label: 'Sign out', icon: 'log-out', separator: true },
];

export const FIRST_STEPS: KtFirstStep[] = [
  {
    id: 'workspace',
    title: 'Create your workspace',
    description: 'Done when you signed up.',
    done: true,
  },
  {
    id: 'customers',
    title: 'Meet your customers',
    description: 'Who you bill, and what they owe.',
    action: 'Open customers',
    href: '#/customers',
  },
  {
    id: 'profile',
    title: 'Check your profile',
    description: 'The name and email on every invoice you send.',
    action: 'Open settings',
    href: '#/settings',
  },
  {
    id: 'overview',
    title: 'See the overview',
    description: 'What is billed, paid and late, this month.',
    action: 'Go to the overview',
  },
];

export const INVOICE_COLUMNS: KtTableColumn[] = [
  { key: 'id', label: 'Invoice' },
  { key: 'customer', label: 'Customer' },
  { key: 'amount', label: 'Amount', align: 'right' },
  { key: 'status', label: 'Status' },
  { key: 'due', label: 'Due' },
];

export const CUSTOMER_COLUMNS: KtTableColumn[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'company', label: 'Company', sortable: true },
  { key: 'status', label: 'Status' },
  { key: 'balance', label: 'Balance', align: 'right' },
];
