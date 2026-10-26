/**
 * The Model Context Protocol over stdio, as much of it as a server of tools
 * needs: JSON-RPC 2.0, one message a line — initialize, ping, tools/list and
 * tools/call. No dependency, so `npx kanto-mcp` starts at once.
 */
import { createInterface } from 'node:readline';
import { callTool, TOOLS } from './tools.js';

/** The versions of the protocol it speaks, the newest first. */
const PROTOCOLS = ['2025-06-18', '2025-03-26', '2024-11-05'];

const INSTRUCTIONS = `Kanto is a library of web components (kt-*) that run in any framework.
Before building a piece of UI, look for the component: list_components, or search_docs.
Before using one, read it with get_component: its page and its API. get_install gives a
framework's setup, get_guide the rules and the theming. Data goes in as properties, not
attributes; events are kt-prefixed CustomEvents with the payload in detail.`;

/** The answer to one message, or undefined for a notification. */
export function handle(data, message) {
  const { id, method } = message ?? {};
  if (id === undefined || id === null) return undefined;
  const params = message.params ?? {};
  const answer = (result) => ({ jsonrpc: '2.0', id, result });
  const refuse = (code, text) => ({ jsonrpc: '2.0', id, error: { code, message: text } });
  try {
    return reply();
  } catch (error) {
    // A tool that throws answers with an error; the server keeps serving.
    return refuse(
      -32603,
      `kanto-mcp failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  function reply() {
    switch (method) {
      case 'initialize':
        return answer({
          protocolVersion: PROTOCOLS.includes(params.protocolVersion)
            ? params.protocolVersion
            : PROTOCOLS[0],
          capabilities: { tools: {} },
          serverInfo: { name: 'kanto-mcp', version: data.version },
          instructions: INSTRUCTIONS,
        });
      case 'ping':
        return answer({});
      case 'tools/list':
        return answer({ tools: TOOLS });
      case 'tools/call':
        if (!TOOLS.some((tool) => tool.name === params.name)) {
          return refuse(
            -32602,
            `No tool "${params.name}". The tools: ${TOOLS.map((tool) => tool.name).join(', ')}.`,
          );
        }
        return answer(callTool(data, params.name, params.arguments));
      default:
        return refuse(-32601, `No method ${method}`);
    }
  }
}

/** Reads messages a line at a time from `input`, writes each answer as a line to `output`. */
export function serve(data, input = process.stdin, output = process.stdout) {
  const lines = createInterface({ input, crlfDelay: Infinity });
  lines.on('line', (line) => {
    if (!line.trim()) return;
    let message;
    try {
      message = JSON.parse(line);
    } catch {
      output.write(
        `${JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Not JSON' } })}\n`,
      );
      return;
    }
    const reply = handle(data, message);
    if (reply) output.write(`${JSON.stringify(reply)}\n`);
  });
  return lines;
}
