/**
 * How each AI agent is pointed at Kanto's instructions: the file to write
 * and what goes in it. The home page and the AI agents guide both show these,
 * from here, so the two never disagree.
 */
export interface AgentSetup {
  readonly id: string;
  readonly name: string;
  /** Where the line goes, in the project. */
  readonly file: string;
  /** What to write there. */
  readonly snippet: string;
  /** Said before the snippet in the guide. */
  readonly how: string;
}

/** The instructions, as the package ships them. */
export const AGENTS_FILE = 'node_modules/kanto-ds/dist/AGENTS.md';

export const AGENT_SETUPS: readonly AgentSetup[] = [
  {
    id: 'claude',
    name: 'Claude Code',
    file: 'CLAUDE.md',
    how: 'add a line to `CLAUDE.md` at the root of your project:',
    snippet: `@${AGENTS_FILE}`,
  },
  {
    id: 'cursor',
    name: 'Cursor',
    file: '.cursor/rules/kanto.mdc',
    how: 'create `.cursor/rules/kanto.mdc`:',
    snippet: `---
description: Building interface with the Kanto design system
alwaysApply: true
---
Follow ${AGENTS_FILE} for any interface work.`,
  },
  {
    id: 'copilot',
    name: 'GitHub Copilot',
    file: '.github/copilot-instructions.md',
    how: 'add to `.github/copilot-instructions.md`:',
    snippet: `This project's interface uses Kanto. Follow ${AGENTS_FILE}.`,
  },
  {
    id: 'any',
    name: 'Any agent',
    file: 'AGENTS.md',
    how: 'for Codex, and any agent that reads `AGENTS.md`, add to the one at your project’s root:',
    snippet: `For interface work, follow ${AGENTS_FILE}.`,
  },
];

/** The setups as the guide's markdown: a paragraph and a block each. */
export function agentSetupsMarkdown(): string {
  return AGENT_SETUPS.map(
    (setup) => `**${setup.name}** — ${setup.how}

\`\`\`markdown
${setup.snippet}
\`\`\``,
  ).join('\n\n');
}
