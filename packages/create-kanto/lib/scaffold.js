import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from 'node:fs';
import { basename, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { STACKS, TEMPLATES } from './choices.js';

/** The templates bundled in the package, or the repository's own while developing it. */
export function templatesDir() {
  const bundled = fileURLToPath(new URL('../templates', import.meta.url));
  return existsSync(bundled)
    ? bundled
    : fileURLToPath(new URL('../../../templates', import.meta.url));
}

/** npm's rules for a name: lowercase, nothing but letters, digits and `-._~`. */
export function packageName(name) {
  const cleaned = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._~-]+/g, '-')
    .replace(/^[-._~]+|[-._~]+$/g, '');
  return cleaned || 'kanto-app';
}

/** Copies `<template>-<stack>` into `target` and makes it a project of its own. Returns `target`. */
export function scaffold({
  template,
  stack,
  target,
  name = basename(resolve(target)),
  from = templatesDir(),
}) {
  if (!TEMPLATES.some((choice) => choice.id === template)) {
    throw new Error(
      `Unknown template "${template}". Choose ${TEMPLATES.map((c) => c.id).join(', ')}.`,
    );
  }
  if (!STACKS.some((choice) => choice.id === stack)) {
    throw new Error(`Unknown stack "${stack}". Choose ${STACKS.map((c) => c.id).join(', ')}.`);
  }
  const source = join(from, `${template}-${stack}`);
  if (!existsSync(source)) throw new Error(`There is no ${template} template for ${stack} yet.`);
  if (existsSync(target) && readdirSync(target).length > 0) {
    throw new Error(`${target} is not empty. Choose a new folder, or empty this one.`);
  }

  mkdirSync(target, { recursive: true });
  cpSync(source, target, {
    recursive: true,
    filter: (path) =>
      !/(^|[\\/])(node_modules|dist|package-lock\.json)([\\/]|$)/.test(relative(source, path)),
  });
  if (existsSync(join(target, '_gitignore'))) {
    renameSync(join(target, '_gitignore'), join(target, '.gitignore'));
  }
  const manifest = join(target, 'package.json');
  const pkg = JSON.parse(readFileSync(manifest, 'utf8'));
  pkg.name = packageName(name);
  writeFileSync(manifest, `${JSON.stringify(pkg, null, 2)}\n`);
  return target;
}
