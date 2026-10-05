// @vitest-environment node
import { get as httpGet } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createServer, type ViteDevServer } from 'vite';

/** A page from the local server. The setup stubs `fetch`: no test reaches the network. */
const get = (url: string) =>
  new Promise<{ status: number; body: string }>((resolve, reject) => {
    httpGet(url, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk: string) => (body += chunk));
      response.on('end', () => resolve({ status: response.statusCode ?? 0, body }));
    }).on('error', reject);
  });

/**
 * `npm run dev` runs the templates' demos too: the template pages frame
 * `./templates/<id>/`, which only the site's build used to hold — in dev the
 * frame showed the docs site itself.
 */
describe('the docs dev server', () => {
  let server: ViteDevServer;
  let base: string;

  beforeAll(async () => {
    server = await createServer({
      configFile: 'demo/vite.config.ts',
      logLevel: 'silent',
      server: { port: 0, hmr: false },
    });
    await server.listen();
    const address = server.httpServer!.address();
    base = `http://localhost:${typeof address === 'object' && address ? address.port : 0}`;
  }, 30_000);

  afterAll(async () => {
    await server?.close();
  });

  it('serves each template demo, not the docs page', async () => {
    for (const [id, title] of [
      ['saas', 'Northwind'],
      ['dashboard', 'Northwind — operations console'],
    ]) {
      const page = (await get(`${base}/templates/${id}/`)).body;
      expect(page, id).toContain(`<title>${title}</title>`);
    }
  });

  it('serves a demo’s own modules, with Kanto from src/', async () => {
    const main = await get(`${base}/templates/saas/src/main.ts`);
    expect(main.status).toBe(200);
    expect(main.body).toContain('/src/index.ts');
  });

  it('still serves the docs at the root', async () => {
    expect((await get(`${base}/`)).body).toContain('<title>Kanto');
  });
});
