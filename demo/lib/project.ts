/**
 * The project's own facts, read from `package.json`.
 *
 * The site used to spell the version, the repository and the npm name out by
 * hand in three files. Every one of those is a promise to remember, and the
 * header chip proved the point by still reading `v1.0.0` after the package had
 * moved on. There is one copy of each fact in this repository, and it is the
 * manifest — so the site reads it rather than repeating it.
 *
 * The version is the *published* one. `npm run release` bumps `package.json`
 * from the top section of the changelog, and the documentation site is built
 * from the release tag, so what a reader sees is the version they can install.
 * Between releases it deliberately lags the changelog's unreleased section.
 */
import { name, version, description, repository } from '../../package.json';

export const PROJECT_NAME = name;
export const PROJECT_DESCRIPTION = description;

/** The published version, bare: `1.0.0`. */
export const VERSION = version;

/** The published version as a tag, the way the releases spell it: `v1.0.0`. */
export const VERSION_TAG = `v${version}`;

/** `1.0` — for places that mean the line rather than the patch. */
export const VERSION_MINOR = version.split('.').slice(0, 2).join('.');

/**
 * `owner` and `repo`, from the manifest's git URL.
 *
 * npm accepts several spellings (`git+https://host/owner/repo.git`, `git@github.com:…`,
 * a bare `owner/repo`), so this takes the last two path-ish segments rather
 * than trying to match the whole grammar.
 */
function parseRepository(url: string): { owner: string; repo: string } {
  const [repo = PROJECT_NAME, owner = ''] = url
    .replace(/\.git$/, '')
    .split(/[/:]/)
    .filter(Boolean)
    .reverse();

  return { owner, repo };
}

const { owner, repo } = parseRepository(
  typeof repository === 'string' ? repository : repository.url,
);

export const REPO_OWNER = owner;
export const REPO_NAME = repo;
export const REPO_SLUG = `${owner}/${repo}`;
export const REPO_URL = `https://github.com/${REPO_SLUG}`;
export const NPM_URL = `https://www.npmjs.com/package/${PROJECT_NAME}`;
export const INSTALL_COMMAND = `npm install ${PROJECT_NAME}`;
