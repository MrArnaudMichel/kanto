/**
 * The documents a new visitor finds. Once they type, theirs are kept instead
 * (src/store.ts).
 */
import type { Doc } from './documents';

export const APP = { name: 'Northwind Docs', person: 'Dana Whitfield' };

/** Where a new document goes. */
export const DEFAULT_FOLDER = 'Northwind';

const day = (date: string) => Date.parse(`${date}T09:00:00Z`);

export const SEED: readonly Doc[] = [
  {
    id: 'launch-plan',
    title: 'Launch plan',
    folder: 'Northwind',
    updated: day('2026-10-05'),
    versions: [],
    body: `# Launch plan

Recurring invoices ship on **20 October**. This page is the one place for what is left.

## Before

- Finish the reminder emails
- Price the yearly plan
- Brief support on the new settings

## The day

1. Turn the flag on for 10% of workspaces
2. Watch the error rate for an hour
3. Then everyone

> If anything looks wrong, turn the flag off first and ask questions after.

Questions go to [the launch channel](https://example.com/launch).`,
  },
  {
    id: 'meeting-notes',
    title: 'Meeting notes — 6 October',
    folder: 'Northwind',
    updated: day('2026-10-06'),
    versions: [],
    body: `# Meeting notes — 6 October

Present: Dana, Frank, Chloe.

- Revenue is down 3% while orders are up: the average basket fell.
- *Decision:* look at the discount codes before anything else.
- Chloe takes the empty states in the console.`,
  },
  {
    id: 'writing-guide',
    title: 'How to write here',
    folder: 'Help',
    updated: day('2026-10-01'),
    versions: [],
    body: `# How to write here

Everything is Markdown: what you type is what is kept.

## Formatting

- **Bold** with \`**\`, *italic* with \`*\`, \`code\` with backticks
- Headings start with \`#\`, lists with \`-\` or \`1.\`, quotes with \`>\`
- Links: \`[text](https://…)\`

The toolbar does the same to what you select. Your work saves itself, and **History** keeps a version a minute.

\`\`\`
Ctrl+B  bold     (Cmd+B on a Mac)
Ctrl+I  italic   (Cmd+I on a Mac)
Ctrl+K  link     (Cmd+K on a Mac)
\`\`\``,
  },
];
