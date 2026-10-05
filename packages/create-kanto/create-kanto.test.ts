import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { readArgs } from './lib/args.js';
import { bundle } from './lib/bundle.js';
import { packageName, scaffold } from './lib/scaffold.js';

const repoTemplates = join(process.cwd(), 'templates');
const made: string[] = [];
const scratch = () => {
  const dir = mkdtempSync(join(tmpdir(), 'create-kanto-'));
  made.push(dir);
  return dir;
};
afterEach(() => {
  for (const dir of made.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('scaffold', () => {
  it('copies the template, names the project, and gives it its .gitignore', () => {
    const from = scratch();
    bundle(repoTemplates, from);
    const target = join(scratch(), 'my-app');
    scaffold({ template: 'saas', stack: 'react', target, from });
    const pkg = JSON.parse(readFileSync(join(target, 'package.json'), 'utf8'));
    expect(pkg.name).toBe('my-app');
    expect(existsSync(join(target, 'src/main.tsx'))).toBe(true);
    expect(existsSync(join(target, '.gitignore'))).toBe(true);
    expect(existsSync(join(target, '_gitignore'))).toBe(false);
    expect(existsSync(join(target, 'node_modules'))).toBe(false);
  });

  it('makes a valid npm name of any folder name', () => {
    expect(packageName('My App')).toBe('my-app');
    expect(packageName('  Northwind_2026! ')).toBe('northwind_2026');
    expect(packageName('...')).toBe('kanto-app');
  });

  it('refuses a folder that is not empty', () => {
    const target = scratch();
    writeFileSync(join(target, 'notes.txt'), 'mine');
    expect(() => scaffold({ template: 'saas', stack: 'vue', target, from: repoTemplates })).toThrow(
      /not empty/,
    );
    expect(readdirSync(target)).toEqual(['notes.txt']);
  });

  it('names the choices when given one it does not have', () => {
    const target = join(scratch(), 'x');
    expect(() =>
      scaffold({ template: 'shop', stack: 'react', target, from: repoTemplates }),
    ).toThrow(/Unknown template "shop".*saas/);
    expect(() =>
      scaffold({ template: 'saas', stack: 'svelte', target, from: repoTemplates }),
    ).toThrow(/Unknown stack "svelte".*react, vue, vanilla/);
  });
});

describe('bundle', () => {
  it('copies every template, leaving builds behind and hiding .gitignore from npm', () => {
    const from = scratch();
    mkdirSync(join(from, 'saas-react', 'node_modules', 'x'), { recursive: true });
    mkdirSync(join(from, 'saas-react', 'dist'), { recursive: true });
    writeFileSync(join(from, 'saas-react', '.gitignore'), 'node_modules\n');
    writeFileSync(join(from, 'saas-react', 'package.json'), '{"name":"t"}');
    writeFileSync(join(from, 'saas-react', 'package-lock.json'), '{}');
    const to = scratch();
    expect(bundle(from, to)).toEqual(['saas-react']);
    expect(readdirSync(join(to, 'saas-react')).sort()).toEqual(['_gitignore', 'package.json']);
  });
});

describe('readArgs', () => {
  it('reads a folder and every flag', () => {
    expect(readArgs(['my-app', '--template', 'saas', '--stack', 'vue', '--yes'])).toEqual({
      dir: 'my-app',
      template: 'saas',
      stack: 'vue',
      yes: true,
      help: false,
    });
    expect(readArgs(['-h'])).toMatchObject({ help: true, yes: false });
  });
});
