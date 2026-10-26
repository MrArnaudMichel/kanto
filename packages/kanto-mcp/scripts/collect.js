/**
 * kanto-mcp's data, read from the repository at this commit: every
 * component's page and its API — from the source, as the custom elements
 * manifest reads it — the guides, and each framework's setup. The package
 * ships it as data.json (scripts/bundle.js), so `npx kanto-mcp` needs
 * nothing else.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { create, ts } from '@custom-elements-manifest/analyzer';
import { litPlugin } from '@custom-elements-manifest/analyzer/src/features/framework-plugins/lit/lit.js';
import { agentsMd, componentDocs, docForPackage } from '../../../scripts/llms.js';

/** The sections of docs/frameworks.md each framework's setup is made of. */
const INSTALLS = {
  vanilla: ['Vanilla'],
  html: ['No build step'],
  react: ['React'],
  vue: ['Vue'],
  angular: ['Angular'],
  svelte: ['Svelte'],
  ssr: ['Server-side rendering'],
};

const sources = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sources(path);
    return entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts') ? [path] : [];
  });

/** Every element the source declares, by tag, as the manifest describes it. */
function manifest(root) {
  const modules = sources(join(root, 'src/components')).map((file) =>
    ts.createSourceFile(
      relative(root, file),
      readFileSync(file, 'utf8'),
      ts.ScriptTarget.ES2022,
      true,
    ),
  );
  const { modules: described } = create({ modules, plugins: litPlugin() });
  const elements = new Map();
  for (const module of described) {
    for (const declaration of module.declarations ?? []) {
      if (declaration.tagName) elements.set(declaration.tagName, declaration);
    }
  }
  return elements;
}

const typeOf = (entry) => entry.type?.text ?? '';

/** What a page of the API lists: public, documented, with types and defaults. */
function apiOf(element) {
  const members = (element?.members ?? []).filter(
    (member) => !member.privacy && !member.static && !member.name.startsWith('_'),
  );
  return {
    attributes: (element?.attributes ?? []).map((attribute) => ({
      name: attribute.name,
      type: typeOf(attribute),
      default: attribute.default ?? '',
      description: attribute.description ?? '',
    })),
    properties: members
      .filter((member) => member.kind === 'field' && !member.attribute)
      .map((member) => ({
        name: member.name,
        type: typeOf(member),
        default: member.default ?? '',
        description: member.description ?? '',
      })),
    methods: members
      .filter((member) => member.kind === 'method' && member.description)
      .map((member) => ({
        name: member.name,
        signature: `${member.name}(${(member.parameters ?? []).map((parameter) => parameter.name).join(', ')})`,
        description: member.description ?? '',
      })),
    events: (element?.events ?? [])
      .filter((event) => event.name)
      .map((event) => ({
        name: event.name,
        type: typeOf(event),
        description: event.description ?? '',
      })),
    slots: (element?.slots ?? []).map((slot) => ({
      name: slot.name,
      description: slot.description ?? '',
    })),
    parts: (element?.cssParts ?? []).map((part) => ({
      name: part.name,
      description: part.description ?? '',
    })),
    cssProperties: (element?.cssProperties ?? []).map((property) => ({
      name: property.name,
      default: property.default ?? '',
      description: property.description ?? '',
    })),
  };
}

/** A markdown file's `## ` sections, by heading. */
function sectionsOf(markdown) {
  const sections = new Map();
  for (const part of markdown.split(/\n(?=## )/).slice(1)) {
    const heading = /^## (.*)/.exec(part)[1].trim();
    sections.set(heading, part.replace(/\n---\s*$/, '').trim());
  }
  return sections;
}

export async function collect(root) {
  const read = (path) => readFileSync(join(root, path), 'utf8');
  const { version } = JSON.parse(read('package.json'));
  const elements = manifest(root);
  const components = componentDocs().map((doc) => ({
    tag: doc.tag,
    group: doc.group,
    summary: doc.summary,
    doc: docForPackage(doc),
    api: apiOf(elements.get(doc.tag)),
  }));

  const frameworks = read('docs/frameworks.md');
  const sections = sectionsOf(frameworks);
  const rules = sections.get('Two rules that apply everywhere');
  const installs = Object.fromEntries(
    Object.entries(INSTALLS).map(([id, headings]) => [
      id,
      [...headings.map((heading) => sections.get(heading)), rules].join('\n\n'),
    ]),
  );

  const guides = [
    { id: 'agents', title: 'Writing Kanto right: the rules for an AI agent', text: agentsMd() },
    { id: 'frameworks', title: 'Using Kanto with a framework', text: frameworks },
    {
      id: 'tokens',
      title: 'Tokens, themes, the accent colour and appearance',
      text: read('src/tokens/README.md'),
    },
  ];
  return { version, components, guides, installs };
}
