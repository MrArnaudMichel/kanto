/**
 * Custom Elements Manifest: the machine-readable description of every element
 * — attributes, properties, events, slots, CSS parts — read from the JSDoc and
 * the Lit decorators in the source.
 *
 * Editors and tools consume it: WebStorm reads `web-types.json` and VS Code
 * reads `vscode.html-custom-data.json` for autocompletion and hover docs in
 * plain HTML, Storybook and API docs generators read the manifest itself.
 */
import { customElementJetBrainsPlugin } from 'custom-element-jet-brains-integration';
import { customElementVsCodePlugin } from 'custom-element-vs-code-integration';

/**
 * The analyser reads src/, but only dist/ is published: point every module
 * reference at the compiled file a consumer can actually import.
 */
function publishedPaths() {
  /** @param {unknown} node */
  const rewrite = (node) => {
    if (Array.isArray(node)) return node.forEach(rewrite);
    if (!node || typeof node !== 'object') return;
    const record = /** @type {Record<string, unknown>} */ (node);
    for (const [key, value] of Object.entries(record)) {
      if ((key === 'path' || key === 'module') && typeof value === 'string') {
        record[key] = value.replace(/^\/?src\//, 'dist/').replace(/\.ts$/, '.js');
      } else {
        rewrite(value);
      }
    }
  };
  return {
    name: 'published-paths',
    /** @param {{ customElementsManifest: unknown }} context */
    packageLinkPhase({ customElementsManifest }) {
      rewrite(customElementsManifest);
    },
  };
}

export default {
  globs: ['src/components/**/*.ts'],
  exclude: ['src/**/*.test.ts'],
  outdir: 'dist',
  litelement: true,
  // package.json declares `customElements` itself; a build must not rewrite it.
  packagejson: false,
  plugins: [
    publishedPaths(),
    customElementJetBrainsPlugin({ outdir: 'dist', excludeCss: true, hideLogs: true }),
    customElementVsCodePlugin({ outdir: 'dist', hideLogs: true }),
  ],
};
