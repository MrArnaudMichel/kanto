import { describe, expect, it } from 'vitest';
import './defaults.js';
import { getIcon } from './registry.js';

describe('the icons Kanto ships', () => {
  it('include those its own elements draw', () => {
    for (const name of ['chevron-down', 'x', 'check', 'search', 'calendar', 'loader-circle']) {
      expect(getIcon(name), name).toBeDefined();
    }
  });

  it('include the few a first screen reaches for, so the docs examples draw', () => {
    for (const name of [
      'plus',
      'pencil',
      'settings',
      'download',
      'upload',
      'external-link',
      'filter',
      'ellipsis',
      'refresh-cw',
    ]) {
      expect(getIcon(name), name).toBeDefined();
    }
  });
});
