import { html, type TemplateResult } from 'lit';

/**
 * A heading at the level a page needs. A block or a footer cannot know where
 * it sits in the page's outline, so its heading level is the page's to set;
 * this draws that level, kept between 1 and 6, `fallback` when it is not a
 * number.
 */
export function heading(
  level: number,
  text: string | TemplateResult,
  className = '',
  fallback = 2,
): TemplateResult {
  const at = Number.isFinite(level) ? Math.min(6, Math.max(1, Math.round(level))) : fallback;
  switch (at) {
    case 1:
      return html`<h1 class=${className}>${text}</h1>`;
    case 3:
      return html`<h3 class=${className}>${text}</h3>`;
    case 4:
      return html`<h4 class=${className}>${text}</h4>`;
    case 5:
      return html`<h5 class=${className}>${text}</h5>`;
    case 6:
      return html`<h6 class=${className}>${text}</h6>`;
    default:
      return html`<h2 class=${className}>${text}</h2>`;
  }
}
