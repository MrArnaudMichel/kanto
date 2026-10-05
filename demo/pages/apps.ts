/** Apps: products built with Kanto, a card each, and the way to add yours. */
import { html } from 'lit';
import { BUILT_WITH, SHOW_YOURS } from '../lib/built-with.js';
import type { DocPage } from './component.js';

export function appsPage(): DocPage {
  return {
    title: 'Showcase',
    summary: 'Products built with Kanto. To start one of your own, take a template.',
    eyebrow: 'Apps',
    headings: [],
    source: 'demo/lib/built-with.ts',
    body: html`<ul class="built-with">
      ${BUILT_WITH.map(
        (product) =>
          html`<li class="built-with-card">
            <a
              class="built-with-shot"
              href=${product.url}
              target="_blank"
              rel="noopener"
              tabindex="-1"
              aria-hidden="true"
            >
              <img src=${`./${product.image}`} alt="" loading="lazy" width="1400" height="860" />
            </a>
            <div class="built-with-body">
              <h2><a href=${product.url} target="_blank" rel="noopener">${product.name}</a></h2>
              <p>${product.description}</p>
              <p class="built-with-by">By ${product.by}</p>
            </div>
          </li>`,
      )}
      <li class="built-with-card built-with-yours">
        <div class="built-with-body">
          <h2>Built something with Kanto?</h2>
          <p>Show it here: a name, a link and a line, and it gets a card.</p>
          <a href=${SHOW_YOURS} target="_blank" rel="noopener">Show it</a>
        </div>
      </li>
    </ul>`,
  };
}
