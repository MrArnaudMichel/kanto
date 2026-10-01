# Docs site home page — design

Date: 2026-10-02 · Status: approved in chat, awaiting review of this document

## Goal

A visitor arriving on the docs site should want to try Kanto on their own
project within a minute. Today the site opens on "Introduction", a page of
prose. The site has strong material: live apps, 49 components and now a
Customise menu. None of it is visible on arrival.

Decided with Arnaud:

- **Centrepiece:** a live playground — Kanto re-themed in front of you, with
  the code to take away.
- **Tone:** a polished product page. Short concrete sentences and checkable
  proof; no hype. Kanto is free, and the page can say so plainly.
- **Customise in the top bar:** the button shows its label, and on the first
  visit a small invitation points at it, once.
- **Language:** the site stays in English.

## Design

### Route

- A new route `#/` (also `#/home`) renders the home page, inside the docs
  chrome: top bar, no sidebar, no contents rail. The page is full width.
- An empty hash goes there instead of to Introduction.
- The wordmark links to `#/`.
- The Guide, Components, Apps and Release sections are unchanged.

### Page, top to bottom

1. **Hero.** Left-aligned, on Kanto's own tokens. The copy is a starting
   point.
   - Headline: "Components that take your brand in a minute."
   - Lead: "Kanto is 49 web components for dashboards, admin tools and forms.
     They run in any framework, pass accessibility checks in both themes, and
     take your colour, font and density from one line. Free and open source."
   - Actions:
     - a primary `kt-button` "Get started", linking to Installation;
     - a copyable `npm install kanto-ds` chip, which says "Copied" once
       clicked;
     - a GitHub link.

2. **Playground.** This is the one bold element of the page, directly under
   the hero.
   - **Controls column:**
     - Colour: the 7 swatches plus a custom colour;
     - Font: a list showing each face;
     - Corners, Density, Text size: segmented controls;
     - Theme: Dark or Light.
   - **Preview frame:** a small but real Kanto screen.
     - A `kt-stat` row and a `kt-chart`.
     - A short form: `kt-input`, `kt-select`, `kt-date-picker`,
       `kt-toggle`, a primary and a secondary button.
     - A 4-row `kt-table` with `kt-badge` statuses.
   - **The settings apply to the frame only.** They are set as `data-*`
     attributes on the frame, through `setAppearance(…, frame)`. This
     demonstrates container theming, and the page around stays readable.
     - Theme inside the frame: Kanto has no dark-in-light, so a dark choice
       on a light page cannot be shown in the frame. The frame's theme
       control therefore offers what the page can show: it toggles light on
       the frame when the page is dark. When the page is light, it is
       replaced by a note to switch the site's theme. The implementation
       plan settles the exact behaviour.
   - **Take it with you:**
     - "Copy my theme" copies a snippet;
     - a `kt-tabs` with two tabs, "HTML attributes" and "JavaScript", shows
       the snippet and updates live. Only the settings that differ from
       Kanto's defaults appear:
       - HTML: `<html data-accent="teal" data-font="inter">`
       - JavaScript:
         `setAppearance({ accent: 'teal', font: 'inter' });`
       - A custom colour appears as its hex.
     - "Use on this site" applies the playground's appearance to the whole
       docs site, through the Customise menu's own state, so it persists and
       shows in that menu.
   - The playground's state lives only in the page. A visit starts from the
     site's current appearance.

3. **Same component, every framework.** One sentence, then `kt-tabs` with
   tabs React, Vue, Angular and HTML. Each shows the real minimal usage of
   the same `kt-button` with a `kt-change`/click handler, in Kanto's code
   style.

4. **In real apps.** One sentence, then the four demo apps (Console, Chat,
   Landing, Portfolio).
   - Each is a live miniature: an `iframe` of `#/app/<path>`, scaled down,
     non-interactive (`inert`, `tabindex="-1"`, `aria-hidden`),
     `loading="lazy"`.
   - Each has a name, a one-line description and an "Open the app" link.
   - Below 720px the miniatures are replaced by plain link rows.

5. **Start in three steps.** This is a real sequence, so it is numbered:
   install, import, use, each with its short code block. Then "Read the
   guide".

Not on the page:

- feature-card grids;
- uppercase eyebrows;
- arrows on buttons;
- reveal-on-scroll animation.

The only motion is a short transition of the frame's colours and sizes
when a setting changes. It is suppressed under `prefers-reduced-motion`.

### Customise button and invitation

- The top bar's Customise button shows its icon and the label "Customise".
  Below 600px it shows the icon only.
- **Invitation:** on a visit with no `kanto-docs-customise-seen` flag, a
  small popover anchored to the button says "Try Kanto in your colours",
  with a close button.
  - It shows after the page has settled, about 1 s after load.
  - It goes away for good when the visitor opens the menu, closes it, or
    uses "Use on this site".
  - It never shows on an app route (`#/app/…`) or on a phone-width screen.
  - When storage is blocked it shows at most once per page load.

### Files

- `demo/pages/home.ts`: the page.
- `demo/lib/playground.ts`: the playground's state and rendering.
- `demo/lib/snippet.ts`: pure functions, appearance to HTML and JS
  snippets.
- `demo/lib/invite.ts`: the invitation's flag logic.
- `demo/home.css`, or a home section in `shell.css`.
- `demo/main.ts`: the route, the wordmark and the label.

## Testing

- **`snippet.ts`, unit:**
  - defaults give `<html>` and `setAppearance({})` with a comment;
  - each setting appears only when it is not the default;
  - a custom colour appears as its hex;
  - key order is stable.
- **`invite.ts`, unit:** shows once; never on app routes; stays dismissed
  across reloads; survives blocked storage.
- **Playground, unit:**
  - a change sets attributes on the frame and not on `<html>`;
  - the snippet updates;
  - "Use on this site" calls the docs appearance with the playground's
    values;
  - "Copy my theme" writes the HTML or JS snippet, whichever tab is shown,
    to the clipboard (mocked).
- **Route, unit:** an empty hash and `#/` render the home page; the wordmark
  links to it.
- **axe:** the home page in both themes, as an a11y browser case or a demo
  test.
- **Visual:** screenshots of the home page in dark and light, in Chromium
  and Firefox, at desktop and 400px; the playground in several settings;
  the invitation.
- Full `npm run verify` before each commit.

## Out of scope

- Opening the playground's theme in StackBlitz or CodeSandbox.
- Screenshots or videos as assets; the miniatures are live.
- Translating the site.
