#!/usr/bin/env node
/**
 * Cuts a release from `CHANGELOG.md`.
 *
 * Write the section, run this, and the rest follows: the version is taken from
 * the changelog, the notes on the GitHub release are the ones you just wrote,
 * and publishing that release is what deploys the documentation site. There is
 * one place to edit and one command to run, which is the only arrangement that
 * stays honest over time.
 *
 * Everything that can be checked is checked before anything is written, and
 * nothing is pushed until the whole verification chain has passed. `--dry-run`
 * runs the checks and prints what would be published, touching nothing.
 *
 *   npm run release
 *   npm run release:dry
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseRelease } from './changelog.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dryRun = process.argv.includes('--dry-run');

/** Runs a command, letting its output through. Throws if it fails. */
function run(command, args) {
  execFileSync(command, args, { cwd: root, stdio: 'inherit' });
}

/** Runs a command and returns its trimmed output, or null if it failed. */
function capture(command, args) {
  try {
    return execFileSync(command, args, { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return null;
  }
}

function fail(message) {
  console.error(`\n✗ ${message}\n`);
  process.exit(1);
}

const step = (message) => console.log(`  ${message}`);

// ─── What are we releasing? ───────────────────────────────────────────────────

let release;
try {
  release = parseRelease(readFileSync(join(root, 'CHANGELOG.md'), 'utf8'));
} catch (error) {
  fail(error.message);
}

const { version, date, notes } = release;
const tag = `v${version}`;
const title = `Kanto ${version}`;
// `1.1.0-beta.1` is a prerelease; GitHub should say so, and the docs site reads
// that flag to mark it on the release page.
const prerelease = version.includes('-');

console.log(`\n${dryRun ? 'Dry run —' : 'Releasing'} ${title}${prerelease ? ' (prerelease)' : ''}`);
console.log(`  from CHANGELOG.md, dated ${date || 'nothing — add a date to the heading'}\n`);

// ─── Is the repository in a state to release from? ────────────────────────────

const branch = capture('git', ['rev-parse', '--abbrev-ref', 'HEAD']);
if (branch !== 'main') {
  fail(`Releases are cut from main; this is ${branch}.`);
}

if (capture('git', ['status', '--porcelain']) !== '') {
  fail('The working tree has uncommitted changes. Commit or stash them first.');
}

// Fetch before looking for the tag: a tag that exists only on the remote would
// otherwise be found at push time, after the commit has already been made.
step('Fetching origin…');
if (capture('git', ['fetch', '--tags', 'origin']) === null) {
  fail('Could not reach origin.');
}

if (capture('git', ['rev-parse', '--verify', '--quiet', tag]) !== null) {
  fail(`${tag} already exists. Bump the version in CHANGELOG.md.`);
}

const behind = capture('git', ['rev-list', '--count', 'HEAD..origin/main']);
if (behind !== null && behind !== '0') {
  fail(`main is ${behind} commit(s) behind origin. Pull first.`);
}

if (capture('gh', ['auth', 'status']) === null) {
  fail('The GitHub CLI is not authenticated here. Run `gh auth login`.');
}

step(`Ready: ${tag} on top of ${capture('git', ['rev-parse', '--short', 'HEAD'])}`);

// ─── Dry run stops here, having printed what would be published ───────────────

if (dryRun) {
  console.log(`\n${'─'.repeat(72)}\n${notes}\n${'─'.repeat(72)}\n`);
  console.log('Would then: verify, bump package.json, commit, tag, push, create the release.');
  console.log('The verification chain is not run for a dry run.\n');
  process.exit(0);
}

// ─── Nothing is written before this passes ────────────────────────────────────

console.log('\nVerifying…\n');
try {
  run('npm', ['run', 'verify']);
} catch {
  fail('Verification failed. Nothing has been changed.');
}

// ─── Write, tag, push, publish ────────────────────────────────────────────────

console.log('');
const current = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version;
if (current === version) {
  // Re-running after a failure that happened past this point. The files are
  // already right; `npm version` would refuse, so leave them alone.
  step(`package.json is already ${version}`);
} else {
  run('npm', ['version', version, '--no-git-tag-version']);
  run('git', [
    'commit',
    '-m',
    `chore(release): ${version}`,
    '--',
    'package.json',
    'package-lock.json',
  ]);
  step(`Committed chore(release): ${version}`);
}

run('git', ['tag', '-a', tag, '-m', title]);
run('git', ['push', '--follow-tags', 'origin', 'main']);
step(`Pushed ${tag}`);

const args = ['release', 'create', tag, '--title', title, '--notes-file', '-'];
if (prerelease) args.push('--prerelease');
execFileSync('gh', args, { cwd: root, input: notes, stdio: ['pipe', 'inherit', 'inherit'] });

console.log(`\n✓ ${title} published. Publishing the release deploys the site.\n`);
