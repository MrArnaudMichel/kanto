#!/usr/bin/env node
/**
 * npm create kanto@latest [folder] [-- --template saas --stack react --yes]
 *
 * Asks for what it was not told, copies the template, and says what to run.
 */
import { relative, resolve } from 'node:path';
import { stdin, stdout } from 'node:process';
import { createInterface } from 'node:readline/promises';
import { readArgs } from './lib/args.js';
import { STACKS, TEMPLATES } from './lib/choices.js';
import { scaffold } from './lib/scaffold.js';

const HELP = `Start a project on Kanto.

  npm create kanto@latest [folder] -- [options]

  -t, --template   ${TEMPLATES.map((choice) => choice.id).join(' | ')}
  -s, --stack      ${STACKS.map((choice) => choice.id).join(' | ')}
  -y, --yes        take the first choice for anything not given
  -h, --help       this
`;

/** A numbered list; Enter takes the first. Accepts the number or the id. */
async function choose(rl, question, choices) {
  console.log(`\n${question}`);
  choices.forEach((choice, i) =>
    console.log(`  ${i + 1}. ${choice.label}${choice.hint ? ` — ${choice.hint}` : ''}`),
  );
  for (;;) {
    const answer = (await rl.question(`Choose 1–${choices.length} (1): `)).trim();
    if (!answer) return choices[0].id;
    const picked = choices[Number(answer) - 1] ?? choices.find((choice) => choice.id === answer);
    if (picked) return picked.id;
    console.log(`  "${answer}" is not one of them.`);
  }
}

async function main() {
  const args = readArgs(process.argv.slice(2));
  if (args.help) {
    console.log(HELP);
    return;
  }
  const rl = args.yes ? null : createInterface({ input: stdin, output: stdout });
  try {
    const asked = rl && !args.dir ? (await rl.question('Project folder (kanto-app): ')).trim() : '';
    const dir = args.dir ?? (asked || 'kanto-app');
    const template =
      args.template ?? (rl ? await choose(rl, 'Template', TEMPLATES) : TEMPLATES[0].id);
    const stack = args.stack ?? (rl ? await choose(rl, 'Stack', STACKS) : STACKS[0].id);
    const target = scaffold({ template, stack, target: resolve(dir) });
    // `my-app` for a folder made here; the full path for one made elsewhere.
    const near = relative(process.cwd(), target);
    const where = near.startsWith('..') ? target : near || '.';
    console.log(`\nDone. Next:\n\n  cd ${where}\n  npm install\n  npm run dev\n`);
  } finally {
    rl?.close();
  }
}

main().catch((error) => {
  console.error(`\n✗ ${error.message}\n`);
  process.exit(1);
});
