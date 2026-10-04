import { css, html, nothing, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { KtElement, defineElement } from '#internal/kt-element';
import { strings } from '#internal/strings';
import '../kt-avatar/kt-avatar.js';
import type { KtAvatarSize } from '../kt-avatar/kt-avatar.js';

export interface KtAvatarGroupPerson {
  readonly name: string;
  /** A picture; without one the avatar draws the name's initials. */
  readonly src?: string;
}

/**
 * The people on something — a project's members, a document's editors — as
 * avatars overlapping in a row, the rest summed up as "+N".
 *
 * @element kt-avatar-group
 *
 * @csspart list - The `<ul>`.
 * @csspart more - The "+N" at the end.
 *
 * @example
 * ```html
 * <kt-avatar-group label="Project members" max="3"></kt-avatar-group>
 * <script>
 *   group.people = [{ name: 'Dana Whitfield' }, { name: 'Hank Scorpio', src: '/hank.png' }];
 * </script>
 * ```
 */
export class KtAvatarGroup extends KtElement {
  static override styles = [
    KtElement.styles,
    css`
      :host {
        display: inline-block;
        --kt-avatar-size: 32px;
      }
      :host([size='small']) {
        --kt-avatar-size: 24px;
      }
      :host([size='large']) {
        --kt-avatar-size: 48px;
      }

      ul {
        display: flex;
        margin: 0;
        padding: 0;
        list-style: none;
      }
      /* Each one over the last by a third, ringed in the page's colour so the
         overlap reads as a stack, not a smudge. */
      li {
        display: flex;
        border-radius: var(--radius-full);
        box-shadow: 0 0 0 2px var(--surface-page);
      }
      li + li {
        margin-inline-start: calc(var(--kt-avatar-size) * -0.3);
      }

      .more {
        display: grid;
        place-items: center;
        min-width: var(--kt-avatar-size);
        height: var(--kt-avatar-size);
        padding: 0 4px;
        color: var(--text-body);
        font: 600 calc(var(--kt-avatar-size) * 0.36) / 1 var(--font-family-body);
        background: var(--surface-raised);
        border-radius: var(--radius-full);
      }
    `,
  ];

  /** The people. Set as a property: `group.people = [...]`. */
  @property({ attribute: false })
  people: readonly KtAvatarGroupPerson[] = [];

  /** How many avatars to show before summing the rest up. */
  @property({ type: Number })
  max = 4;

  @property({ type: String, reflect: true })
  size: KtAvatarSize = 'medium';

  /** Accessible name for the group: "Project members". */
  @property({ type: String })
  label = '';

  override render(): TemplateResult {
    const shown = this.people.slice(0, Math.max(0, this.max));
    const rest = this.people.length - shown.length;
    return html`<ul part="list" aria-label=${this.label || nothing}>
      ${shown.map(
        (person) =>
          html`<li>
            <kt-avatar
              name=${person.name}
              src=${person.src || nothing}
              size=${this.size}
            ></kt-avatar>
          </li>`,
      )}
      ${
        rest > 0
          ? html`<li>
              <span part="more" class="more" role="img" aria-label=${strings().moreCount(rest)}
                >+${rest}</span
              >
            </li>`
          : nothing
      }
    </ul>`;
  }
}

defineElement('kt-avatar-group', KtAvatarGroup);

declare global {
  interface HTMLElementTagNameMap {
    'kt-avatar-group': KtAvatarGroup;
  }
}
