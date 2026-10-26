/** What the deploy runs: a site whose live demos did not build must not go out. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const pages = readFileSync(join(process.cwd(), '.github/workflows/pages.yml'), 'utf8');
const publish = readFileSync(join(process.cwd(), '.github/workflows/publish.yml'), 'utf8');

describe('the Pages deploy', () => {
  it('checks the live demos after building the site, before uploading it', () => {
    const build = pages.indexOf('npm run build:demo');
    const check = pages.indexOf('node scripts/check-demo.js --demos');
    const upload = pages.indexOf('upload-pages-artifact');
    expect(build).toBeGreaterThan(-1);
    expect(check).toBeGreaterThan(build);
    expect(upload).toBeGreaterThan(check);
  });

  it('installs Chromium before building: the build writes each page from a browser', () => {
    const install = pages.indexOf('npx playwright install --with-deps chromium');
    expect(install).toBeGreaterThan(-1);
    expect(pages.indexOf('npm run build:demo')).toBeGreaterThan(install);
  });
});

describe('the npm publish', () => {
  it('publishes kanto-mcp beside create-kanto, once the library is out', () => {
    const library = publish.indexOf('npm publish');
    const mcp = publish.indexOf('working-directory: packages/kanto-mcp');
    expect(mcp).toBeGreaterThan(publish.indexOf('working-directory: packages/create-kanto'));
    expect(mcp).toBeGreaterThan(library);
    expect(publish.slice(mcp)).toContain('npm view kanto-mcp version');
  });
});
