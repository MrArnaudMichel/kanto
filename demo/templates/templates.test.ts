import { afterEach, describe, expect, it } from 'vitest';
import 'kanto-ds';
import { getIcon } from 'kanto-ds/icons';
import { TEMPLATES, runTemplate } from './index.js';
import { templateProject } from '../lib/stackblitz.js';

afterEach(() => {
  document.body.replaceChildren();
});

describe('the templates', () => {
  it('each have a unique slug, a name and a description', () => {
    expect(new Set(TEMPLATES.map((t) => t.slug)).size).toBe(TEMPLATES.length);
    expect(TEMPLATES.length).toBeGreaterThanOrEqual(4);
    for (const template of TEMPLATES) {
      expect(template.name, template.slug).toBeTruthy();
      expect(template.description, template.slug).toBeTruthy();
    }
  });

  it('use only elements Kanto defines', () => {
    for (const template of TEMPLATES) {
      const tags = new Set([...template.html.matchAll(/<(kt-[a-z-]+)/g)].map((m) => m[1]!));
      for (const tag of tags)
        expect(customElements.get(tag), `${template.slug}: ${tag}`).toBeDefined();
    }
  });

  it('draw only the icons Kanto ships, so a copy shows every one', () => {
    for (const template of TEMPLATES) {
      for (const [, name] of template.html.matchAll(/icon="([a-z0-9-]+)"/g)) {
        expect(getIcon(name!), `${template.slug}: ${name}`).toBeDefined();
      }
    }
  });

  it('run their script on their own markup without an error', () => {
    for (const template of TEMPLATES) {
      document.body.innerHTML = template.html;
      expect(() => runTemplate(template), template.slug).not.toThrow();
      document.body.replaceChildren();
    }
  });

  it('open on StackBlitz as the same markup and script', () => {
    const template = TEMPLATES[0]!;
    const project = templateProject(template, '1.8.0');
    expect(project.files['index.html']).toContain(template.html.trim().split('\n')[0]!.trim());
    expect(project.files['main.js']).toContain("import 'kanto-ds';");
    expect(project.files['main.js']).toContain(template.script.trim().split('\n').at(-1)!.trim());
  });
});
