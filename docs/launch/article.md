# One component library for every framework, and for your AI agent

_An article for dev.to, Medium or the blog. About 900 words; link it from
the Show HN comment and the Product Hunt page._

## The problem

A dashboard needs the same twenty pieces whatever it is built in: a table that
sorts and pages, a date picker that handles a range, a command palette, a
toast, a side panel. Each framework has its libraries for them, each with its
own look, and switching framework — or having two in one company — means
switching all of them.

## Custom elements, once

Kanto writes them once, as standard custom elements. `<kt-table>` is a tag the
browser knows; React 19, Vue, Angular and Svelte pass it properties and listen
to its events like any element. Two rules cover every framework: data goes in
as properties, not attributes, and events are `kt-` CustomEvents with their
payload in `detail`.

```html
<kt-table label="Invoices" sortable></kt-table>
<script type="module">
  import 'kanto-ds';
  document.querySelector('kt-table').data = invoices;
</script>
```

## Your brand in one line

Every colour, radius and spacing is a token. An accent, a font, a radius and a
density are attributes on any container:

```html
<body data-accent="teal" data-font="inter" data-radius="round" data-density="compact"></body>
```

A brand colour that is not a preset is one call, `setAppearance({ accent:
'#e11d48' })`, and Kanto derives the hover, the soft tint and a readable text
colour from it.

## Accessible, checked in a browser

Each component's tests run in Chromium as well as in a simulated DOM: real
focus, the top layer for dialogs and menus, hit testing, the contrast of the
colours as computed. What a screen reader announces is part of each page of
the docs.

## Made for AI agents too

Agents write a lot of UI now, and they write it from what they know. Kanto
gives them three ways to know it:

- `AGENTS.md` in the package, with the rules and every component in a line —
  one line in a project's instructions points the agent at it;
- `llms.txt` and `llms-full.txt` on the site, for a chat that cannot read
  the project;
- `kanto-mcp`, an MCP server: `claude mcp add kanto -- npx -y kanto-mcp`, and
  the agent lists the components, searches the docs and reads a component's
  whole API at the installed version before using it.

## A whole project in one command

`npm create kanto@latest` starts a SaaS app, an admin console, an editor, a
landing page, a chat, a portfolio or release notes, in React, Vue or plain
TypeScript — routed, typed and building.

## Try it

- The docs, with every component live: https://kanto.arnaudmichel.fr
- The source, MIT: https://github.com/MrArnaudMichel/kanto
- `npm install kanto-ds`
