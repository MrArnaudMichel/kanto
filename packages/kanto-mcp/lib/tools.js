/**
 * What kanto-mcp offers an assistant: the components, each one's page and
 * API, a search across the docs, the guides and each framework's setup —
 * all from the data built into the package, at the library's version.
 */

const INSTALL_ALIASES = {
  next: 'react',
  nextjs: 'react',
  nuxt: 'vue',
  sveltekit: 'svelte',
  cdn: 'html',
  none: 'html',
  js: 'vanilla',
  typescript: 'vanilla',
  vite: 'vanilla',
};

export const TOOLS = [
  {
    name: 'list_components',
    description:
      'Lists every Kanto web component (kt-*) with one line on what it is for, by group. Use it to choose the component for a piece of UI before writing one by hand.',
    inputSchema: {
      type: 'object',
      properties: {
        group: {
          type: 'string',
          description:
            'Only this group: core, forms, navigation, feedback, overlays, data or blocks.',
        },
      },
    },
  },
  {
    name: 'get_component',
    description:
      "Gives a Kanto component's documentation page and its whole API — attributes, properties, methods, events, slots, CSS parts and custom properties. Read it before using a component.",
    inputSchema: {
      type: 'object',
      properties: {
        tag: { type: 'string', description: 'The tag, such as kt-date-picker (or date-picker).' },
      },
      required: ['tag'],
    },
  },
  {
    name: 'search_docs',
    description:
      "Searches Kanto's documentation — every component page and the guides — and gives the pages that best answer the question, most relevant first.",
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'What to look for, in words: "sortable table", "dark theme".',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_guide',
    description:
      "Gives one of Kanto's guides whole: agents (the rules for writing Kanto right), frameworks (setup in each framework) or tokens (tokens, themes, the accent colour, appearance).",
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string', enum: ['agents', 'frameworks', 'tokens'] } },
      required: ['id'],
    },
  },
  {
    name: 'get_install',
    description:
      'Gives the steps to install and set up Kanto in a framework, with the two rules that apply everywhere: data as properties, kt- events with their payload in detail.',
    inputSchema: {
      type: 'object',
      properties: {
        framework: {
          type: 'string',
          enum: ['react', 'vue', 'angular', 'svelte', 'vanilla', 'html', 'ssr'],
          description:
            'html is a page without a build step, from the CDN; ssr is Next, Nuxt and the like.',
        },
      },
      required: ['framework'],
    },
  },
];

const ok = (text) => ({ content: [{ type: 'text', text }] });
const refuse = (text) => ({ content: [{ type: 'text', text }], isError: true });

function distance(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const kept = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
      previous = kept;
    }
  }
  return row[b.length];
}

const words = (text) =>
  String(text)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 1)
    .map((word) => word.replace(/(?<=..)s$/, ''));

function listComponents(data, { group } = {}) {
  const wanted = group ? String(group).toLowerCase() : '';
  const shown = data.components.filter((component) => !wanted || component.group === wanted);
  if (!shown.length)
    return refuse(
      `No group "${group}". The groups: ${[...new Set(data.components.map((c) => c.group))].join(', ')}.`,
    );
  const groups = [...new Set(shown.map((component) => component.group))];
  return ok(
    groups
      .map((each) => {
        const lines = shown
          .filter((component) => component.group === each)
          .map((c) => `- ${c.tag} — ${c.summary}`);
        return `## ${each[0].toUpperCase()}${each.slice(1)}\n\n${lines.join('\n')}`;
      })
      .join('\n\n') + '\n\nRead one with get_component before using it.',
  );
}

const code = (text) => (text ? `\`${text}\`` : '');

function apiText(api) {
  const list = (heading, items, line) =>
    items.length ? [`### ${heading}`, '', ...items.map(line), ''] : [];
  const detail = (item) =>
    [code(item.type), item.default && `default ${code(item.default)}`].filter(Boolean).join(', ');
  const entry = (item) =>
    `- ${code(item.name)}${detail(item) ? ` (${detail(item)})` : ''}${item.description ? `: ${item.description}` : ''}`;
  return [
    '## API, from the custom elements manifest',
    '',
    ...list('Attributes', api.attributes, entry),
    ...list('Properties, set from script', api.properties, entry),
    ...list('Methods', api.methods, (item) => `- ${code(item.signature)}: ${item.description}`),
    ...list('Events', api.events, entry),
    ...list(
      'Slots',
      api.slots,
      (item) => `- ${item.name ? code(item.name) : 'default'}: ${item.description}`,
    ),
    ...list('CSS parts', api.parts, (item) => `- ${code(item.name)}: ${item.description}`),
    ...list('CSS custom properties', api.cssProperties, entry),
  ]
    .join('\n')
    .trim();
}

function getComponent(data, { tag } = {}) {
  const asked = String(tag ?? '')
    .trim()
    .toLowerCase();
  const wanted = asked.startsWith('kt-') ? asked : `kt-${asked}`;
  const component = data.components.find((each) => each.tag === wanted);
  if (component) return ok(`${component.doc.trim()}\n\n${apiText(component.api)}\n`);
  const close = data.components
    .map((each) => ({
      tag: each.tag,
      far: each.tag.includes(asked.replace(/^kt-/, '')) ? 0 : distance(each.tag, wanted),
    }))
    .sort((a, b) => a.far - b.far)
    .slice(0, 3)
    .map((each) => each.tag);
  return refuse(
    `Kanto has no ${wanted}. The closest: ${close.join(', ')}. list_components lists them all.`,
  );
}

/** What search_docs looks through: each component, and each section of each guide. */
function documentsOf(data) {
  return [
    ...data.components.map((component) => ({
      title: component.tag,
      line: component.summary,
      head: `${component.tag} ${component.summary}`,
      body: component.doc,
      next: `get_component ${component.tag}`,
    })),
    ...data.guides.flatMap((guide) =>
      guide.text.split(/\n(?=## )/).map((section) => {
        const heading = /^#+ (.*)/.exec(section)?.[1] ?? guide.title;
        return {
          title: `${guide.id} › ${heading}`,
          line: section
            .replace(/^#.*\n/, '')
            .trim()
            .split('\n\n')[0]
            .replace(/\s*\n\s*/g, ' ')
            .slice(0, 160),
          head: `${guide.id} ${heading}`,
          body: section,
          next: `get_guide ${guide.id}`,
        };
      }),
    ),
  ];
}

function searchDocs(data, { query } = {}) {
  const asked = [...new Set(words(query ?? ''))];
  if (!asked.length) return refuse('Say what to look for: search_docs { "query": "date range" }.');
  const ranked = documentsOf(data)
    .map((document) => {
      const head = words(document.head);
      const body = words(document.body);
      let found = 0;
      let score = 0;
      for (const word of asked) {
        const inHead = head.some((each) => each.includes(word));
        const inBody = body.filter((each) => each === word).length;
        if (inHead || inBody) found += 1;
        score += (inHead ? 10 : 0) + Math.min(inBody, 5);
      }
      return { document, score: found >= Math.ceil(asked.length / 2) ? score * found : 0 };
    })
    .filter((each) => each.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
  if (!ranked.length)
    return ok(`Nothing in Kanto's docs matches "${query}". list_components lists every component.`);
  return ok(
    ranked
      .map(({ document }) => `${document.title} — ${document.line} (${document.next})`)
      .join('\n'),
  );
}

function getGuide(data, { id } = {}) {
  const guide = data.guides.find((each) => each.id === String(id ?? '').toLowerCase());
  if (!guide)
    return refuse(
      `No guide "${id}". The guides: ${data.guides.map((each) => each.id).join(', ')}.`,
    );
  return ok(guide.text);
}

function getInstall(data, { framework } = {}) {
  const asked = String(framework ?? '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
  const id = INSTALL_ALIASES[asked] ?? asked;
  const steps = data.installs[id];
  if (!steps)
    return refuse(
      `No setup for "${framework}". The frameworks: ${Object.keys(data.installs).join(', ')}.`,
    );
  return ok(`npm install kanto-ds@${data.version.split('.')[0]}\n\n${steps}`);
}

const RUN = {
  list_components: listComponents,
  get_component: getComponent,
  search_docs: searchDocs,
  get_guide: getGuide,
  get_install: getInstall,
};

export function callTool(data, name, args = {}) {
  const tool = RUN[name];
  if (!tool)
    return refuse(
      `kanto-mcp has no tool "${name}". Its tools: ${TOOLS.map((each) => each.name).join(', ')}.`,
    );
  return tool(data, args ?? {});
}
