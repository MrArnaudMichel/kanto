#!/usr/bin/env node
/**
 * Builds and opens every project in templates/, the way someone who forked it
 * would: against the kanto-ds package npm would ship, with the template's own
 * dependencies installed from the registry. Then it walks the build in
 * Chromium with the template kind's smoke test (scripts/template-smoke.js).
 *
 *   npm run build && npm run check:templates            every template
 *   npm run check:templates saas-react saas-vue          some of them
 *
 * Needs the network for the templates' dependencies, so it is not part of
 * `npm run verify`; CI runs it in a job of its own, and before every publish.
 */
import { execFileSync, spawn } from 'node:child_process';
import { cpSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { SMOKES } from './template-smoke.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const only = process.argv.slice(2);
const all = readdirSync(join(root, 'templates'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);
const templates = only.length ? all.filter((name) => only.includes(name)) : all;

if (templates.length === 0) {
  console.error(`\n✗ No templates to check${only.length ? ` among ${only.join(', ')}` : ''}.\n`);
  process.exit(1);
}

const work = mkdtempSync(join(tmpdir(), 'kanto-templates-'));
const failures = [];

/** Runs a command quietly; on failure, the error carries its output. */
function run(command, args, cwd) {
  execFileSync(command, args, { cwd, stdio: 'pipe', encoding: 'utf8' });
}

/** Serves a build with `vite preview` and resolves once it answers. */
async function serve(cwd, port) {
  const server = spawn(
    'npx',
    ['vite', 'preview', '--port', String(port), '--strictPort', '--host', '127.0.0.1'],
    {
      cwd,
      stdio: 'ignore',
    },
  );
  const url = `http://127.0.0.1:${port}/`;
  for (let tries = 0; tries < 100; tries += 1) {
    try {
      if ((await fetch(url)).ok) return { server, url };
    } catch {
      // Not up yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  server.kill();
  throw new Error(`vite preview did not answer on ${url}`);
}

try {
  execFileSync('npm', ['pack', '--pack-destination', work, '--silent'], { cwd: root });
  const tarball = join(
    work,
    readdirSync(work).find((file) => file.endsWith('.tgz')),
  );
  const browser = await chromium.launch();
  let port = 4310;

  for (const name of templates) {
    const kind = name.split('-')[0];
    const smoke = SMOKES[kind];
    if (!smoke) {
      failures.push(`${name}: scripts/template-smoke.js has no "${kind}" walk`);
      continue;
    }

    const app = join(work, name);
    const source = join(root, 'templates', name);
    cpSync(source, app, {
      recursive: true,
      filter: (path) => !/(^|[\\/])(node_modules|dist)([\\/]|$)/.test(relative(source, path)),
    });
    let step = 'reading package.json';
    try {
      const pkg = JSON.parse(readFileSync(join(app, 'package.json'), 'utf8'));
      pkg.dependencies['kanto-ds'] = `file:${tarball}`;
      writeFileSync(join(app, 'package.json'), `${JSON.stringify(pkg, null, 2)}\n`);
      step = 'npm install';
      run('npm', ['install', '--no-audit', '--no-fund', '--loglevel=error'], app);
      step = 'npm run typecheck';
      run('npm', ['run', 'typecheck'], app);
      step = 'npm run build';
      run('npm', ['run', 'build'], app);
    } catch (error) {
      failures.push(
        `${name}: ${step} failed\n${error.stdout ?? ''}${error.stderr ?? ''}${error.stdout || error.stderr ? '' : error.message}`,
      );
      continue;
    }

    port += 1;
    let served;
    const page = await browser.newPage();
    const errors = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));
    try {
      served = await serve(app, port);
      await smoke(page, served.url);
      if (errors.length) throw new Error(`errors in the console:\n    ${errors.join('\n    ')}`);
      console.log(`ok   ${name}`);
    } catch (error) {
      failures.push(`${name}: ${error.message}`);
    } finally {
      await page.close();
      served?.server.kill();
    }
  }
  await browser.close();
} finally {
  rmSync(work, { recursive: true, force: true });
}

if (failures.length) {
  console.error(
    `\n✗ Templates that would not work for someone who forked them:\n  ${failures.join('\n  ')}\n`,
  );
  process.exit(1);
}
console.log(`\nEvery template installs, builds and runs against the packed package.`);
