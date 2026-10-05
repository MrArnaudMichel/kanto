import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  STACKS as TOOL_STACKS,
  TEMPLATES as TOOL_TEMPLATES,
} from '../../packages/create-kanto/lib/choices.js';
import { createCommand, degitCommand, STACKS, TEMPLATE_CATALOG } from './templates.js';

const root = process.cwd();

describe('the templates catalog', () => {
  it('lists exactly the templates create-kanto makes, in its order, with its stacks', () => {
    const made = TEMPLATE_CATALOG.filter((entry) => entry.project).map((entry) => entry.id);
    expect(made).toEqual(TOOL_TEMPLATES.map((t: { id: string }) => t.id));
    expect(STACKS.map((stack) => stack.id)).toEqual(TOOL_STACKS.map((s: { id: string }) => s.id));
  });

  it('shows every demo as a template, each with its demo running', () => {
    expect(TEMPLATE_CATALOG.map((entry) => entry.id)).toEqual(
      expect.arrayContaining(['saas', 'dashboard', 'landing', 'chat', 'portfolio']),
    );
    expect(new Set(TEMPLATE_CATALOG.map((entry) => entry.id)).size).toBe(TEMPLATE_CATALOG.length);
    for (const entry of TEMPLATE_CATALOG) {
      expect(entry.demo, entry.id).toMatch(
        /^\.\/(templates\/[a-z-]+\/(#\/[a-z-]*)?|#\/app\/[a-z/-]+)$/,
      );
    }
    expect(TEMPLATE_CATALOG.find((entry) => entry.id === 'landing')!.demo).toBe(
      './templates/landing/',
    );
    expect(TEMPLATE_CATALOG.find((entry) => entry.id === 'portfolio')!.demo).toBe(
      './templates/portfolio/',
    );
    expect(TEMPLATE_CATALOG.find((entry) => entry.id === 'saas')!.demo).toBe(
      './templates/saas/#/sign-in',
    );
  });

  it('has a project for each template in each stack', () => {
    for (const entry of TEMPLATE_CATALOG.filter((candidate) => candidate.project)) {
      for (const stack of STACKS) {
        expect(
          existsSync(join(root, 'templates', `${entry.id}-${stack.id}`, 'package.json')),
          `${entry.id}-${stack.id}`,
        ).toBe(true);
      }
    }
  });

  it('links each component it names to a page that exists', () => {
    for (const entry of TEMPLATE_CATALOG) {
      for (const tag of entry.components) {
        const found = [
          'core',
          'forms',
          'navigation',
          'feedback',
          'overlays',
          'data',
          'blocks',
        ].some((group) => existsSync(join(root, 'src/components', group, tag, `${tag}.md`)));
        expect(found, tag).toBe(true);
      }
    }
  });

  it('writes the commands a person copies', () => {
    expect(createCommand('saas', 'vue')).toBe(
      'npm create kanto@latest my-app -- --template saas --stack vue',
    );
    expect(degitCommand('saas', 'react')).toBe(
      'npx degit MrArnaudMichel/kanto/templates/saas-react my-app',
    );
  });

  it('has a screenshot for every screen it shows', () => {
    for (const entry of TEMPLATE_CATALOG) {
      expect(entry.screens.length, entry.id).toBeGreaterThan(0);
      for (const screen of entry.screens) {
        expect(existsSync(join(root, 'demo/public/templates', screen.file)), screen.file).toBe(
          true,
        );
      }
    }
  });
});
