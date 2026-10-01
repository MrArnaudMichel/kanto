import { afterEach, describe, expect, it, vi } from 'vitest';
import { KT_DEFAULT_APPEARANCE } from 'kanto-ds';
import { openInStackBlitz, stackblitzProject } from './stackblitz.js';

const with_ = (patch: object) => ({ ...KT_DEFAULT_APPEARANCE, ...patch });

afterEach(() => {
  vi.restoreAllMocks();
  document.body.replaceChildren();
});

describe('stackblitzProject', () => {
  it('is a Vite project on the published minor, which npm already serves', () => {
    const project = stackblitzProject(KT_DEFAULT_APPEARANCE, '1.6.1');
    expect(project.template).toBe('node');
    const pkg = JSON.parse(project.files['package.json']!);
    expect(pkg.dependencies['kanto-ds']).toBe('^1.6.0');
    expect(pkg.devDependencies.vite).toBeDefined();
    expect(pkg.scripts.dev).toBe('vite');
    expect(project.files['main.js']).toContain("import 'kanto-ds';");
    expect(project.files['main.js']).toContain("import 'kanto-ds/styles.css';");
  });

  it('carries the chosen appearance as attributes on <html>', () => {
    const project = stackblitzProject(with_({ accent: 'teal', density: 'compact' }), '1.6.1');
    expect(project.files['index.html']).toContain(
      '<html lang="en" data-accent="teal" data-density="compact">',
    );
    expect(project.files['main.js']).not.toContain('setAccent');
  });

  it('sets a custom colour from the script, which no attribute can hold', () => {
    const project = stackblitzProject(with_({ accent: '#e11d48' }), '1.6.1');
    expect(project.files['index.html']).toContain('<html lang="en">');
    expect(project.files['main.js']).toContain("setAccent('#e11d48');");
  });

  it('opens on a small real screen, not a blank page', () => {
    const html = stackblitzProject(KT_DEFAULT_APPEARANCE, '1.6.1').files['index.html']!;
    for (const tag of ['kt-stat', 'kt-input', 'kt-select', 'kt-button', 'kt-table']) {
      expect(html).toContain(`<${tag}`);
    }
  });
});

describe('openInStackBlitz', () => {
  it('posts the project to StackBlitz in a new tab, and leaves nothing behind', () => {
    const submit = vi.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(function (
      this: HTMLFormElement,
    ) {
      expect(this.method).toBe('post');
      expect(this.target).toBe('_blank');
      expect(this.action).toBe('https://stackblitz.com/run?file=index.html');
      const field = this.querySelector<HTMLInputElement>(
        'input[name="project[files][package.json]"]',
      );
      expect(field?.value).toContain('kanto-ds');
      expect(this.querySelector('input[name="project[template]"]')!.getAttribute('value')).toBe(
        'node',
      );
    });
    openInStackBlitz(stackblitzProject(KT_DEFAULT_APPEARANCE, '1.6.1'));
    expect(submit).toHaveBeenCalledOnce();
    expect(document.querySelector('form')).toBeNull();
  });
});
