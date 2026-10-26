import { spawn } from 'node:child_process';
import { readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { collect } from './scripts/collect.js';
import { callTool, TOOLS } from './lib/tools.js';
import { handle } from './lib/server.js';

const root = process.cwd();
const tags = readdirSync(join(root, 'src/components'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .flatMap((group) => readdirSync(join(root, 'src/components', group.name)))
  .filter((name) => name.startsWith('kt-'));

type Data = Awaited<ReturnType<typeof collect>>;
let data: Data;
const text = (name: string, args: Record<string, unknown> = {}) =>
  callTool(data, name, args).content[0]!.text;

// It reads the whole library's source, as the package's build does.
beforeAll(async () => {
  data = await collect(root);
}, 60_000);

describe("kanto-mcp's data, from the repository", () => {
  it('has every component, with its page and its API from the source', () => {
    expect(data.components.map((component) => component.tag).sort()).toEqual([...tags].sort());
    const button = data.components.find((component) => component.tag === 'kt-button')!;
    expect(button.summary).toBe('The Kanto action button.');
    expect(button.doc).toMatch(/^# /);
    expect(button.api.attributes.map((attribute: { name: string }) => attribute.name)).toContain(
      'variant',
    );
    expect(button.api.parts.map((part: { name: string }) => part.name)).toContain('button');
    const select = data.components.find((component) => component.tag === 'kt-select')!;
    expect(select.api.events.map((event: { name: string }) => event.name)).toContain('kt-change');
  });

  it("is at the library's version", () => {
    expect(data.version).toMatch(/^\d+\.\d+\.\d+/);
  });
});

describe("kanto-mcp's tools", () => {
  it('are the five an assistant needs, each described', () => {
    expect(TOOLS.map((tool) => tool.name)).toEqual([
      'list_components',
      'get_component',
      'search_docs',
      'get_guide',
      'get_install',
    ]);
    for (const tool of TOOLS) {
      expect(tool.description.length, tool.name).toBeGreaterThan(40);
      expect(tool.inputSchema.type, tool.name).toBe('object');
    }
  });

  it('lists every component with what it is for, or one group of them', () => {
    const all = text('list_components');
    for (const tag of tags) expect(all, tag).toContain(tag);
    expect(all).toContain('kt-button — The Kanto action button.');
    const forms = text('list_components', { group: 'forms' });
    expect(forms).toContain('kt-select');
    expect(forms).not.toContain('kt-button');
  });

  it('gives a component its page and its whole API, by tag or by name', () => {
    const page = text('get_component', { tag: 'kt-button' });
    expect(page).toMatch(/^# /);
    expect(page).toContain('## API, from the custom elements manifest');
    expect(page).toContain('`variant`');
    expect(page).toContain('### CSS parts');
    expect(text('get_component', { tag: 'button' })).toBe(page);
    expect(text('get_component', { tag: 'KT-Button' })).toBe(page);
  });

  it('says which components come close to a tag it does not know', () => {
    const result = callTool(data, 'get_component', { tag: 'kt-datepicker' });
    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toContain('kt-date-picker');
  });

  it('finds the page that answers a question', () => {
    expect(text('search_docs', { query: 'date picker' }).split('\n')[0]).toContain(
      'kt-date-picker',
    );
    expect(text('search_docs', { query: 'sortable table columns' })).toContain('kt-table');
    expect(text('search_docs', { query: 'accent colour' })).toContain('tokens');
    expect(text('search_docs', { query: 'zzzz qqqq' })).toMatch(/^Nothing/);
  });

  it('gives the guides, and the setup for each framework', () => {
    expect(text('get_guide', { id: 'tokens' })).toContain('# Token layer');
    expect(text('get_guide', { id: 'agents' })).toContain('properties, not attributes');
    expect(callTool(data, 'get_guide', { id: 'nope' }).isError).toBe(true);
    expect(text('get_install', { framework: 'react' })).toContain('npm install kanto-ds');
    expect(text('get_install', { framework: 'react' })).toContain('## React');
    expect(text('get_install', { framework: 'vue' })).toContain('## Vue');
    expect(text('get_install', { framework: 'html' })).toContain('cdn.jsdelivr.net');
    expect(callTool(data, 'get_install', { framework: 'cobol' }).isError).toBe(true);
  });

  it('turns down a tool it does not have', () => {
    expect(callTool(data, 'delete_everything', {}).isError).toBe(true);
  });
});

describe('the MCP server', () => {
  const ask = (method: string, params: unknown = {}) =>
    handle(data, { jsonrpc: '2.0', id: 1, method, params });

  it('introduces itself, offering tools', () => {
    const answer = ask('initialize', {
      protocolVersion: '2025-06-18',
      capabilities: {},
      clientInfo: { name: 'test', version: '1' },
    });
    expect(answer).toMatchObject({
      jsonrpc: '2.0',
      id: 1,
      result: {
        protocolVersion: '2025-06-18',
        capabilities: { tools: {} },
        serverInfo: { name: 'kanto-mcp', version: data.version },
      },
    });
    expect((answer as { result: { instructions: string } }).result.instructions).toContain(
      'get_component',
    );
  });

  it('answers with its own protocol version to one it does not speak', () => {
    expect(ask('initialize', { protocolVersion: '1999-01-01' })).toMatchObject({
      result: { protocolVersion: '2025-06-18' },
    });
  });

  it('lists its tools and runs one', () => {
    expect(ask('tools/list')).toMatchObject({ result: { tools: TOOLS } });
    expect(
      ask('tools/call', { name: 'get_install', arguments: { framework: 'svelte' } }),
    ).toMatchObject({
      result: { content: [{ type: 'text', text: expect.stringContaining('## Svelte') }] },
    });
  });

  it('answers a ping, stays silent on a notification, refuses what it does not know', () => {
    expect(ask('ping')).toEqual({ jsonrpc: '2.0', id: 1, result: {} });
    expect(handle(data, { jsonrpc: '2.0', method: 'notifications/initialized' })).toBeUndefined();
    expect(ask('resources/list')).toMatchObject({ error: { code: -32601 } });
  });
});

describe('npx kanto-mcp', () => {
  const file = join(root, 'packages/kanto-mcp/data.json');
  beforeAll(() => writeFileSync(file, JSON.stringify(data)));
  afterAll(() => rmSync(file, { force: true }));

  it('talks MCP over stdio, one message a line', async () => {
    const server = spawn(process.execPath, [join(root, 'packages/kanto-mcp/index.js')]);
    const lines: string[] = [];
    let buffer = '';
    const answered = new Promise<void>((resolve) => {
      server.stdout.on('data', (chunk: Buffer) => {
        buffer += chunk.toString();
        const parts = buffer.split('\n');
        buffer = parts.pop()!;
        lines.push(...parts.filter(Boolean));
        if (lines.length >= 2) resolve();
      });
    });
    const send = (message: unknown) => server.stdin.write(`${JSON.stringify(message)}\n`);
    send({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: { protocolVersion: '2025-06-18', capabilities: {} },
    });
    send({ jsonrpc: '2.0', method: 'notifications/initialized' });
    send({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: { name: 'get_component', arguments: { tag: 'kt-button' } },
    });
    await answered;
    server.kill();
    const [hello, button] = lines.map((line) => JSON.parse(line));
    expect(hello).toMatchObject({ id: 1, result: { serverInfo: { name: 'kanto-mcp' } } });
    expect(button.id).toBe(2);
    expect(button.result.content[0].text).toContain('## API, from the custom elements manifest');
  });
});
