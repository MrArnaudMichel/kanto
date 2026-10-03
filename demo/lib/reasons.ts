/**
 * The home page's three reasons, each made by a live example rather than a
 * claim: motion that says what happened, a look that is one attribute away,
 * and a keyboard that reaches everything.
 */
import { html, type TemplateResult } from 'lit';
import { ref } from 'lit/directives/ref.js';
import {
  KT_DENSITIES,
  KT_FONTS,
  KT_RADII,
  setAppearance,
  toaster,
  type KtButton,
  type KtDensity,
  type KtFont,
  type KtRadius,
} from 'kanto-ds';

/* === Motion === */

const STEPS = [
  { id: 'details', label: 'Details' },
  { id: 'review', label: 'Review' },
  { id: 'send', label: 'Send' },
];
let step = 1;

function motion(rerender: () => void): TemplateResult {
  const move = (by: number) => {
    step = Math.min(STEPS.length - 1, Math.max(0, step + by));
    rerender();
  };
  return html`<div class="reason-motion">
    <kt-steps label="Invoice" .steps=${STEPS} current=${STEPS[step]!.id}></kt-steps>
    <div class="reason-row">
      <kt-button variant="secondary" ?disabled=${step === 0} @click=${() => move(-1)}
        >Back</kt-button
      >
      <kt-button variant="secondary" ?disabled=${step === STEPS.length - 1} @click=${() => move(1)}
        >Next</kt-button
      >
      <kt-button
        icon="send"
        done-label="Sent"
        @click=${(event: Event) =>
          void (event.currentTarget as KtButton)
            .run(() => new Promise((done) => setTimeout(done, 1400)))
            .then(() => toaster.success('Invoice sent', { duration: 3000 }))}
        >Send</kt-button
      >
    </div>
  </div>`;
}

/* === One line === */

let font: KtFont = 'kanto';
let radius: KtRadius = 'default';
let density: KtDensity = 'default';

/** The line a project writes for the look chosen — defaults left out. */
export function appearanceLine(chosen: {
  font: KtFont;
  radius: KtRadius;
  density: KtDensity;
}): string {
  const parts = Object.entries(chosen)
    .filter(([, value]) => value !== 'default' && value !== 'kanto')
    .map(([key, value]) => ` data-${key}="${value}"`);
  return `<html${parts.join('')}>`;
}

function oneLine(rerender: () => void): TemplateResult {
  const choose = <T extends string>(
    label: string,
    choices: readonly { id: T; label: string }[],
    value: T,
    set: (value: T) => void,
  ) =>
    html`<kt-segmented-control
      size="small"
      label=${label}
      .options=${choices.map((choice) => ({ value: choice.id, label: choice.label }))}
      .value=${value}
      @kt-change=${(event: CustomEvent<{ value: T }>) => {
        set(event.detail.value);
        rerender();
      }}
    ></kt-segmented-control>`;

  return html`<div class="reason-look">
    <div class="reason-look-controls">
      ${choose(
        'Font',
        KT_FONTS.filter((choice) => ['kanto', 'plex', 'geist'].includes(choice.id)).map(
          (choice) => ({
            ...choice,
            label: choice.id === 'plex' ? 'Plex' : choice.label,
          }),
        ),
        font,
        (value) => (font = value),
      )}
      ${choose('Corners', KT_RADII, radius, (value) => (radius = value))}
      ${choose('Density', KT_DENSITIES, density, (value) => (density = value))}
    </div>
    <div
      class="reason-look-preview"
      ${ref((element) => {
        if (element instanceof HTMLElement) setAppearance({ font, radius, density }, element);
      })}
    >
      <kt-label-input label="Workspace">
        <kt-input value="Northwind"></kt-input>
      </kt-label-input>
      <kt-toggle checked>Weekly digest</kt-toggle>
      <div class="reason-row">
        <kt-button variant="secondary">Cancel</kt-button>
        <kt-button>Save changes</kt-button>
      </div>
    </div>
    <p class="reason-look-line">
      <code>${appearanceLine({ font, radius, density })}</code>
      ${
        font === 'kanto' && radius === 'default' && density === 'default'
          ? html`<span>Kanto as it comes: nothing to write.</span>`
          : ''
      }
    </p>
  </div>`;
}

/* === Keyboard === */

function keyboard(): TemplateResult {
  return html`<form class="reason-keys" @submit=${(event: Event) => event.preventDefault()}>
    <p class="reason-hint"><kt-kbd>Tab</kt-kbd> through it, <kt-kbd>Space</kt-kbd> to choose.</p>
    <kt-label-input label="Meeting day">
      <kt-date-input value="2026-10-14"></kt-date-input>
    </kt-label-input>
    <kt-radio-group label="Reminder" name="reminder" value="10">
      <kt-radio value="10">10 minutes before</kt-radio>
      <kt-radio value="60">An hour before</kt-radio>
    </kt-radio-group>
    <kt-checkbox checked>Invite the whole team</kt-checkbox>
  </form>`;
}

export interface Reason {
  readonly heading: string;
  readonly body: string;
  readonly points: readonly string[];
  readonly demo: (rerender: () => void) => TemplateResult;
}

export const REASONS: readonly Reason[] = [
  {
    heading: 'Finished, down to the last frame',
    body: 'Things move only when something changed, and say what it was: a step filling in, a number rolling the way it went, a send button whose plane becomes the spinner and flies off.',
    points: ['Motion on the theme’s timing', 'Off under reduced motion'],
    demo: motion,
  },
  {
    heading: 'Yours in one line',
    body: 'Colour, font, corners, density and text size are attributes on the page. Pick them here and the line below is what you paste.',
    points: ['Any colour, contrast kept', 'Scoped to a page or a panel'],
    demo: oneLine,
  },
  {
    heading: 'Accessible without trying',
    body: 'Every control works from the keyboard and tells a screen reader what it is. Each one is audited by axe in both themes, at every setting, on every release.',
    points: ['4.5:1 text in both themes', 'Keyboard tests per component'],
    demo: () => keyboard(),
  },
];

export function resetReasons(): void {
  step = 1;
  font = 'kanto';
  radius = 'default';
  density = 'default';
}
