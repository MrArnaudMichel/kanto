#!/usr/bin/env node
/**
 * kanto-mcp: Kanto's documentation for AI assistants, as an MCP server on
 * stdio. Add it to Claude Code with `claude mcp add kanto -- npx -y kanto-mcp`.
 */
import { readFileSync } from 'node:fs';
import { serve } from './lib/server.js';

const data = JSON.parse(readFileSync(new URL('./data.json', import.meta.url), 'utf8'));
serve(data);
