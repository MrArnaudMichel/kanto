import { css, html, nothing, type TemplateResult } from 'lit';
import { heading } from './heading.js';

/**
 * What the page blocks share: the room around a section, and the head over
 * its content — a heading and a lead, centred or at the start.
 *
 * A block's heading level is the page's to set (`heading-level`); its items'
 * headings sit one level under it.
 */
export const blockStyles = css`
  :host {
    display: block;
    container-type: inline-size;
  }

  .block {
    display: grid;
    gap: calc(var(--gap-card) * 2);
    padding-block: var(--kt-block-padding, calc(var(--padding-card) * 3));
  }

  .block-head {
    display: grid;
    gap: 12px;
    max-width: 680px;
  }
  :host([align='center']) .block-head {
    justify-items: center;
    margin-inline: auto;
    text-align: center;
  }
  .block-heading {
    margin: 0;
    color: var(--text-body);
    font: var(--font-title-h1);
    letter-spacing: -0.02em;
    text-wrap: balance;
  }
  .block-lead {
    max-width: 60ch;
    margin: 0;
    color: var(--text-muted);
    font: var(--font-normal-regular);
    font-size: calc(17px * var(--text-scale, 1));
    line-height: 1.6;
    text-wrap: pretty;
  }
`;

/** The id a block's section is labelled by, unique per element. */
let count = 0;
export function blockId(prefix: string): string {
  count += 1;
  return `${prefix}-${count}`;
}

/** The head over a block: its heading and lead, when it has them. */
export function blockHead({
  title,
  lead,
  level,
  id,
}: {
  title: string;
  lead: string;
  level: number;
  id: string;
}): TemplateResult | typeof nothing {
  if (!title && !lead) return nothing;
  return html`<div class="block-head">
    ${title ? html`<div id=${id}>${heading(level, title, 'block-heading', 2)}</div>` : nothing}
    ${lead ? html`<p class="block-lead">${lead}</p>` : nothing}
  </div>`;
}
