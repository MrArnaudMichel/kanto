# Show HN

**Title** (80 characters at most):

> Show HN: Kanto – 80 accessible web components that take your brand in one line

**URL:** https://kanto.arnaudmichel.fr

**First comment**, posted right after:

> I build dashboards and admin tools, and kept rewriting the same table, date
> picker and command palette for each framework a client used. Kanto is those
> components once, as standard custom elements (Lit underneath), so the same
> `<kt-table>` runs in React, Vue, Angular, Svelte or a plain HTML page.
>
> A few things I cared about:
>
> - Theming is attributes: `data-accent="teal" data-font="inter"
data-density="compact"` on any container, or `setAppearance({ accent:
'#e11d48' })`. The docs site has a Customise menu that writes the line
>   for you.
> - Accessibility is tested in a real browser, not only linted: focus, the
>   top layer, contrast, what a screen reader hears.
> - AI agents: the package ships an AGENTS.md, the site an llms.txt, and
>   there is an MCP server (`npx -y kanto-mcp`) so Claude Code or Cursor look
>   a component up instead of hand-rolling one.
> - `npm create kanto` starts a whole project — a SaaS, a dashboard, an
>   editor, a landing page — in React, Vue or plain TypeScript.
>
> It is MIT. I also sell a full-stack SaaS starter built on it (Nuxt,
> accounts, billing, an admin panel), which is how I hope to keep working on
> it; the library does not depend on that.
>
> I would especially like to hear where the components get in the way in your
> framework of choice.
