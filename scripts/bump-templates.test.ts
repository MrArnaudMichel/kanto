import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { bumpTemplates, kantoRange } from './bump-templates.js';

let root = '';
afterEach(() => rmSync(root, { recursive: true, force: true }));

const write = (path: string, value: unknown) => {
  mkdirSync(join(root, path, '..'), { recursive: true });
  writeFileSync(join(root, path), `${JSON.stringify(value, null, 2)}\n`);
};
const read = (path: string) => JSON.parse(readFileSync(join(root, path), 'utf8'));

describe('bumpTemplates', () => {
  it('gives kanto-mcp the version too: its data is the library at that release', () => {
    root = mkdtempSync(join(tmpdir(), 'bump-'));
    write('packages/create-kanto/package.json', { version: '1.9.0' });
    write('packages/kanto-mcp/package.json', { name: 'kanto-mcp', version: '1.9.0' });
    expect(bumpTemplates(root, '1.10.0')).toContain('packages/kanto-mcp/package.json');
    expect(read('packages/kanto-mcp/package.json').version).toBe('1.10.0');
  });

  it('gives create-kanto the version, and every template its minor', () => {
    root = mkdtempSync(join(tmpdir(), 'bump-'));
    write('packages/create-kanto/package.json', { name: 'create-kanto', version: '1.9.0' });
    write('templates/saas-react/package.json', {
      dependencies: { 'kanto-ds': '^1.9.0', react: '^19.2.0' },
    });
    write('templates/saas-vue/package.json', { dependencies: { 'kanto-ds': '^1.10.0' } });

    expect(bumpTemplates(root, '1.10.0').sort()).toEqual([
      'packages/create-kanto/package.json',
      'templates/saas-react/package.json',
    ]);
    expect(read('packages/create-kanto/package.json').version).toBe('1.10.0');
    expect(read('templates/saas-react/package.json').dependencies).toEqual({
      'kanto-ds': '^1.10.0',
      react: '^19.2.0',
    });
  });

  it('keeps a prerelease range on the prerelease itself', () => {
    root = mkdtempSync(join(tmpdir(), 'bump-'));
    write('packages/create-kanto/package.json', { version: '1.9.0' });
    write('templates/saas-react/package.json', { dependencies: { 'kanto-ds': '^1.9.0' } });
    bumpTemplates(root, '2.0.0-beta.1');
    expect(read('templates/saas-react/package.json').dependencies['kanto-ds']).toBe(
      '^2.0.0-beta.1',
    );
  });

  it('asks for the minor of a release, and for a prerelease itself', () => {
    expect(kantoRange('1.10.0')).toBe('^1.10.0');
    expect(kantoRange('1.10.3')).toBe('^1.10.0');
    expect(kantoRange('1.10.0-beta.1')).toBe('^1.10.0-beta.1');
  });
});
