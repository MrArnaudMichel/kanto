/** Short guide pages, written here rather than pulled from a repo README. */

export const INTRODUCTION = `# Introduction

Kanto is a design system for data-dense product interfaces — dashboards, admin tools, forms.

The components are standard custom elements, so they run in React, Vue, Angular, Svelte or plain HTML without a per-framework rewrite. One implementation, one place a fix has to land.

## Why custom elements

The alternative — a React port, a Vue port, an Angular library — is three codebases drifting apart.

The trade is real and worth naming: custom elements need JavaScript to upgrade, so they render unstyled-but-present during server rendering until the bundle lands. In return, a component is written once and every consumer gets the same fix at the same time.

## Two rules that hold everywhere

**Data goes in as properties, not attributes.** \`options\`, \`data\`, \`columns\`, \`items\` — anything that is not a string or a boolean. An attribute can only ever hold a string.

**Events are \`kt-\`-prefixed CustomEvents**, with the payload in \`detail\`. They bubble and cross shadow boundaries, so you can listen on a container rather than on every element.

\`\`\`js
select.options = [{ id: 'ne', label: 'North East' }];
select.addEventListener('kt-change', (e) => console.log(e.detail.value));
\`\`\`

## What is in the box

Twenty-eight elements across six groups, a token layer that drives all of them, and a light theme that costs no component-specific CSS.

This site is built with those elements and no framework. If a component breaks, its own documentation breaks with it.
`;

export const INSTALLATION = `# Installation

\`\`\`bash
npm install kanto-ds
\`\`\`

## Import the system

\`\`\`js
import 'kanto-ds';
import 'kanto-ds/styles.css';
\`\`\`

That registers every element and loads the token layer. Then use them as markup:

\`\`\`html
<kt-button variant="primary" icon="plus">New entity</kt-button>
\`\`\`

## Import one element

Applications that use a handful should import those instead, so the bundler can drop the rest:

\`\`\`js
import 'kanto-ds/components/core/kt-button';
import 'kanto-ds/styles.css';
\`\`\`

## Narrower styles

\`styles.css\` is the webfonts, the tokens and a small set of page-level element styles. To keep Kanto out of your global CSS, take the tokens alone:

\`\`\`js
import 'kanto-ds/tokens/index.css';
\`\`\`

## Icons

\`<kt-icon>\` resolves [Lucide](https://lucide.dev) icons by name at render time, which means the set cannot be tree-shaken. Kanto ships only the icons its own elements draw; register whatever else you use, once:

\`\`\`js
import { Rocket, Wallet } from 'lucide';
import { registerIcons } from 'kanto-ds/icons';

registerIcons({ Rocket, Wallet });
\`\`\`

## Theme

Dark is the default and needs no setup. Light is one attribute away:

\`\`\`html
<html data-theme="light">
<html data-theme="auto">
\`\`\`
`;
