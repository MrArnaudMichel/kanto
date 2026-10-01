/**
 * Builds a tiny application against the packed package, the way someone who
 * just ran `npm install kanto-ds` would, and checks the elements made it in.
 *
 * Every other check runs on the repository's sources. This one runs on what
 * npm ships: the tarball, its `exports`, its `sideEffects`. A side-effect
 * import the bundler is told it may drop builds cleanly and renders an empty
 * page — in production only, since a dev server does not tree-shake. That is
 * how `import 'kanto-ds'` once shipped as 670 bytes.
 *
 * Runs after `npm run build`. Nothing is downloaded: the package's own
 * dependencies are linked from this repository's node_modules.
 */
import { execFileSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

/** The ways the docs tell people to load Kanto, each a separate app. */
const ENTRIES = {
  'the whole system': "import 'kanto-ds';\nimport 'kanto-ds/styles.css';",
  Vue: "import 'kanto-ds/vue';",
  'one element': "import 'kanto-ds/components/core/kt-button';",
};

/** Elements each entry must register: one is enough for a single element. */
const EXPECTED = {
  'the whole system': ['kt-button', 'kt-table', 'kt-date-picker', 'kt-time-input'],
  Vue: ['kt-button', 'kt-select'],
  'one element': ['kt-button'],
};

const work = mkdtempSync(join(tmpdir(), 'kanto-consumer-'));
const failures = [];

try {
  // What npm would install.
  execFileSync('npm', ['pack', '--pack-destination', work, '--silent'], { cwd: root });
  const tarball = readdirSync(work).find((file) => file.endsWith('.tgz'));
  const installed = join(work, 'node_modules', 'kanto-ds');
  mkdirSync(installed, { recursive: true });
  execFileSync('tar', ['-xzf', join(work, tarball), '-C', installed, '--strip-components=1']);
  for (const dependency of Object.keys(pkg.dependencies ?? {})) {
    symlinkSync(join(root, 'node_modules', dependency), join(work, 'node_modules', dependency));
  }

  for (const [name, source] of Object.entries(ENTRIES)) {
    const app = join(work, name.replace(/\W+/g, '-'));
    mkdirSync(app);
    writeFileSync(join(app, 'index.html'), '<script type="module" src="./main.js"></script>');
    writeFileSync(join(app, 'main.js'), `${source}\n`);
    await build({
      root: app,
      logLevel: 'silent',
      configFile: false,
      resolve: { preserveSymlinks: false },
      build: { outDir: join(app, 'dist'), minify: false },
    });
    const assets = join(app, 'dist', 'assets');
    const js = readdirSync(assets)
      .filter((file) => file.endsWith('.js'))
      .map((file) => readFileSync(join(assets, file), 'utf8'))
      .join('\n');
    const missing = EXPECTED[name].filter((tag) => !new RegExp(`['"\`]${tag}['"\`]`).test(js));
    if (missing.length) {
      failures.push(
        `${name}: a production build is missing ${missing.join(', ')} (${js.length} bytes of JS)`,
      );
    } else {
      console.log(`ok   ${name}: ${EXPECTED[name].join(', ')} registered`);
    }
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}

if (failures.length) {
  console.error(
    `\n✗ What npm ships does not work in an application:\n  ${failures.join('\n  ')}\n`,
  );
  process.exit(1);
}
console.log('\nThe packed package works in a production build.');
