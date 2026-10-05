import { parseArgs } from 'node:util';

/** `create-kanto [folder] [--template saas] [--stack react] [--yes]`. */
export function readArgs(argv) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      template: { type: 'string', short: 't' },
      stack: { type: 'string', short: 's' },
      yes: { type: 'boolean', short: 'y' },
      help: { type: 'boolean', short: 'h' },
    },
  });
  return {
    dir: positionals[0],
    template: values.template,
    stack: values.stack,
    yes: values.yes ?? false,
    help: values.help ?? false,
  };
}
