# kanto-mcp

[Kanto](https://kanto.arnaudmichel.fr)'s documentation for AI assistants, as an
[MCP](https://modelcontextprotocol.io) server. Your assistant looks up the
component before it writes one by hand, and reads its API before it uses it.

## Add it

Claude Code:

```sh
claude mcp add kanto -- npx -y kanto-mcp
```

Cursor, Windsurf, VS Code or any client that takes a JSON configuration:

```json
{
  "mcpServers": {
    "kanto": { "command": "npx", "args": ["-y", "kanto-mcp"] }
  }
}
```

## Its tools

| Tool              | Gives                                                                                    |
| ----------------- | ---------------------------------------------------------------------------------------- |
| `list_components` | Every `kt-*` component with one line on what it is for, by group.                        |
| `get_component`   | A component's page and its whole API: attributes, properties, events, slots, CSS parts.  |
| `search_docs`     | The pages that best answer a question, across the components and the guides.             |
| `get_guide`       | A guide whole: `agents` (the rules), `frameworks`, `tokens` (theming and appearance).    |
| `get_install`     | The setup in React, Vue, Angular, Svelte, plain TypeScript, a page without a build, SSR. |

It follows the library: kanto-mcp 1.11.0 knows kanto-ds 1.11.0. Its data is
in the package; it reads nothing from the network.
