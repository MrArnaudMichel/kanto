import { describe, expect, it } from 'vitest';
import { rankCommands, type KtCommand } from './command-search.js';

const COMMANDS: KtCommand[] = [
  { id: 'new-invoice', label: 'New invoice', group: 'Create' },
  { id: 'new-customer', label: 'New customer', group: 'Create', keywords: ['client', 'contact'] },
  { id: 'invoices', label: 'Go to invoices', group: 'Navigate' },
  { id: 'invite', label: 'Invite people', group: 'Team' },
  { id: 'settings', label: 'Open settings', group: 'Navigate', keywords: ['préférences'] },
  { id: 'theme', label: 'Switch to light theme', group: 'Appearance' },
  { id: 'export', label: 'Export as CSV', group: 'Actions', disabled: true },
];

const ids = (query: string) => rankCommands(COMMANDS, query).map((command) => command.id);

describe('rankCommands', () => {
  it('lists everything, in the order given, for an empty query', () => {
    expect(ids('')).toEqual(COMMANDS.map((command) => command.id));
    expect(ids('   ')).toEqual(COMMANDS.map((command) => command.id));
  });

  it('keeps commands holding every word typed, in any order', () => {
    expect(ids('invoice new')).toEqual(['new-invoice']);
    expect(ids('theme light')).toEqual(['theme']);
  });

  it('ranks a label that starts with the query, then a word that does, then the rest', () => {
    // "Invite people" starts with it; the two invoices only start a word.
    expect(ids('inv')).toEqual(['invite', 'new-invoice', 'invoices']);
    // Inside a word ranks last: "voice" starts no word.
    expect(ids('voice')).toEqual(['new-invoice', 'invoices']);
    expect(ids('ttings')).toEqual(['settings']);
  });

  it('matches keywords, ignoring case and accents', () => {
    expect(ids('CLIENT')).toEqual(['new-customer']);
    expect(ids('preferences')).toEqual(['settings']);
  });

  it('matches the group name too, below a label match', () => {
    expect(ids('create')).toEqual(['new-invoice', 'new-customer']);
  });

  it('keeps a disabled command visible, so its absence is not a mystery', () => {
    expect(ids('csv')).toEqual(['export']);
  });
});
