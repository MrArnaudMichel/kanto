import { describe, expect, it } from 'vitest';
import { getIcon, registerIcon, registerIcons, registeredIcons, toKebabCase } from './registry.js';

describe('toKebabCase', () => {
  it('splits an ordinary camel boundary', () => {
    expect(toKebabCase('ChevronDown')).toBe('chevron-down');
    expect(toKebabCase('CircleAlert')).toBe('circle-alert');
  });

  it('splits before a digit, the way Lucide names its icons', () => {
    // Lucide calls this one "trash-2". Splitting on case alone yields
    // "trash2", and every <kt-icon name="trash-2"> silently renders nothing.
    expect(toKebabCase('Trash2')).toBe('trash-2');
    expect(toKebabCase('Code2')).toBe('code-2');
    expect(toKebabCase('Volume1')).toBe('volume-1');
  });

  it('splits an acronym run before a word', () => {
    expect(toKebabCase('AArrowDown')).toBe('a-arrow-down');
    expect(toKebabCase('CCircle')).toBe('c-circle');
  });

  it('normalises spaces, underscores and case', () => {
    expect(toKebabCase('chevron_down')).toBe('chevron-down');
    expect(toKebabCase('Chevron Down')).toBe('chevron-down');
    expect(toKebabCase('SEARCH')).toBe('search');
  });

  it('leaves an already-kebab name alone', () => {
    expect(toKebabCase('chevron-down')).toBe('chevron-down');
    expect(toKebabCase('trash-2')).toBe('trash-2');
  });
});

describe('the registry', () => {
  it('resolves an icon under every spelling of its name', () => {
    registerIcon('Trash2', [['path', { d: 'M3 6h18' }]]);

    expect(getIcon('trash-2')).toBeDefined();
    expect(getIcon('Trash2')).toBeDefined();
    expect(getIcon('trash_2')).toBeDefined();
  });

  it('skips non-icon exports when given a whole namespace', () => {
    registerIcons({
      Rocket: [['path', { d: 'M4 4h4' }]],
      createElement: () => undefined,
      version: '1.0.0',
    });

    expect(getIcon('rocket')).toBeDefined();
    expect(registeredIcons()).not.toContain('create-element');
    expect(registeredIcons()).not.toContain('version');
  });
});
