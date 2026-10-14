/**
 * Kanto SaaS Pro: the step after the free templates — the whole SaaS, server
 * side included, paid once. One promise and a real screen first; then what is
 * done, the one command, what is left to write, the screens, free against
 * Pro, the price and the questions. demo/lib/pro.ts holds the words that
 * change; nothing of the product's code lives in this repository.
 */
import { html, type TemplateResult } from 'lit';
import { code } from '../lib/highlight.js';
import {
  PRO,
  PRO_COMPARE,
  PRO_DONE,
  PRO_PARTS,
  PRO_PHONES,
  PRO_QUESTIONS,
  PRO_RESOURCE,
  PRO_SCREENS,
  PRO_SETUP,
  type ProOffer,
} from '../lib/pro.js';

type Pro = ProOffer;

/** A screen of the live demo, in the site's theme: dark by default, light when it is. */
function screen(
  file: string,
  alt: string,
  eager = false,
  size: { width: number; height: number } = { width: 1440, height: 900 },
): TemplateResult {
  const src = (theme: string) => `./pro/${file}-${theme}.webp`;
  // Only one is ever shown: each carries the name, and the hero loads both at once.
  const loading = eager ? 'eager' : 'lazy';
  return html`<span class="pro-shot">
    <img
      class="pro-shot-dark"
      src=${src('dark')}
      alt=${alt}
      width=${size.width}
      height=${size.height}
      loading=${loading}
    />
    <img
      class="pro-shot-light"
      src=${src('light')}
      alt=${alt}
      width=${size.width}
      height=${size.height}
      loading=${loading}
    />
  </span>`;
}

/** Buy: Polar's checkout once the shop is open; until then, said plainly and waiting. */
function buy(pro: Pro, size: 'large' | 'medium' = 'large'): TemplateResult {
  return pro.checkout
    ? html`<a class=${`pro-buy pro-buy-${size}`} href=${pro.checkout} target="_blank" rel="noopener"
        >Buy ${pro.name} — €${pro.price}, once</a
      >`
    : html`<kt-button class="pro-buy" size=${size} disabled
        >Opening soon — €${pro.price}, once</kt-button
      >`;
}

export function proPage(pro: Pro = PRO): TemplateResult {
  return html`<div class="home pro">
    <section class="home-hero pro-hero" aria-labelledby="pro-title">
      <div class="home-hero-text">
        <p class="pro-name">${pro.name}</p>
        <h1 id="pro-title">Write your product. The SaaS around it is done.</h1>
        <p class="home-lead">
          Accounts, teams, plans and billing, an admin panel, messages, an API — in Nuxt, on Kanto,
          wired to the database and the providers you choose in one command. You, or your AI agent,
          write only what makes your product yours.
        </p>
        <div class="home-actions">
          ${buy(pro)}
          ${
            pro.demo
              ? html`<a
                  class="pro-demo pro-button-secondary"
                  href=${pro.demo}
                  target="_blank"
                  rel="noopener"
                  >Open the live demo<kt-icon
                    name="arrow-up-right"
                    size="16"
                    aria-hidden="true"
                  ></kt-icon
                ></a>`
              : ''
          }
        </div>
        <p class="home-note">
          One payment: the private repository and its updates, for good. Nuxt, TypeScript, Kanto.
        </p>
      </div>
      <div class="pro-hero-shot">
        ${screen('home', 'Northwind, an example product built with Kanto SaaS Pro: its overview', true)}
      </div>
    </section>

    <section class="home-band" aria-labelledby="pro-parts">
      <h2 id="pro-parts">Three parts, and you write one</h2>
      <p>
        Your users use the first two; you run the SaaS from the third. All three are built and
        tested — the first is where your product goes.
      </p>
      <ol class="pro-parts">
        ${PRO_PARTS.map(
          (part) =>
            html`<li>
              ${screen(part.file, '')}
              <h3>${part.title}</h3>
              <p class="pro-parts-where">${part.who} · <code>${part.path}</code></p>
              <p>${part.body}</p>
              <kt-badge tone=${part.yours ? 'primary' : 'success'} size="small"
                >${part.yours ? 'You write it' : 'Done'}</kt-badge
              >
              ${
                pro.demo
                  ? html`<a
                      class="pro-try"
                      href=${`${pro.demo.replace(/\/$/, '')}/?as=${part.as}`}
                      target="_blank"
                      rel="noopener"
                      >${part.as === 'creator' ? 'Try it as the creator' : 'Try it as a customer'}<kt-icon
                        name="arrow-up-right"
                        size="14"
                        aria-hidden="true"
                      ></kt-icon
                    ></a>`
                  : ''
              }
            </li>`,
        )}
      </ol>
    </section>

    <section class="home-band" aria-labelledby="pro-done">
      <h2 id="pro-done">Done before you write a line</h2>
      <ul class="pro-done">
        ${PRO_DONE.map(
          (item) =>
            html`<li>
              <kt-icon name=${item.icon} size="20" aria-hidden="true"></kt-icon>
              <h3>${item.title}</h3>
              <p>${item.body}</p>
            </li>`,
        )}
      </ul>
    </section>

    <section class="home-band pro-split" aria-labelledby="pro-setup">
      <div>
        <h2 id="pro-setup">Your stack, in one command</h2>
        <p>
          <code>npm run setup</code> asks for your product's name and brand, a blank page or the
          example product, your database, your accounts and sign-in providers, your mail and your
          payments. It keeps only what you chose — code, packages, guides — writes your
          configuration and your secrets, and starts a fresh history.
        </p>
      </div>
      ${code(PRO_SETUP, 'terminal', { copy: false })}
    </section>

    <section class="home-band pro-split" aria-labelledby="pro-product">
      <div>
        <h2 id="pro-product">What is left is yours</h2>
        <p>
          A list of records is one declaration: its table, permissions, plan limits, API and screens
          follow. Anything else is a service, a route and a page, the way the platform writes its
          own.
        </p>
        <p>
          <code>AGENTS.md</code> gives Claude Code, Cursor or Codex the map, the rules and the
          checks; the guide walks a person through the same, with a worked example.
        </p>
        <figure class="home-agents-prompt">
          <figcaption>Then ask for the product</figcaption>
          <blockquote>
            Add clips: a member uploads a video, trims it, and the team sees the result. Free allows
            three.
          </blockquote>
        </figure>
      </div>
      ${code(PRO_RESOURCE, 'ts')}
    </section>

    <section class="home-band" aria-labelledby="pro-screens">
      <h2 id="pro-screens">Every screen, already there</h2>
      <p>Northwind, the example product, as the live demo runs it.</p>
      <ul class="pro-phones" aria-label="On a phone">
        ${PRO_PHONES.map(
          (each) =>
            html`<li>
              ${screen(each.file, '', false, { width: 390, height: 844 })}
              <span>${each.caption}, on a phone</span>
            </li>`,
        )}
      </ul>
      <ul class="pro-screens">
        ${PRO_SCREENS.filter((each) => each.file !== 'home').map(
          (each) =>
            html`<li>
              ${screen(each.file, '')}
              <span>${each.caption}</span>
            </li>`,
        )}
      </ul>
    </section>

    <section class="home-band" aria-labelledby="pro-compare">
      <h2 id="pro-compare">Free, or Pro</h2>
      <div class="pro-compare-wrap" role="region" aria-label="Free or Pro, compared" tabindex="0">
        <table class="pro-compare">
          <thead>
            <tr>
              <th scope="col"><span class="visually-hidden">What</span></th>
              <th scope="col">Kanto</th>
              <th scope="col">The SaaS template</th>
              <th scope="col">${pro.name}</th>
            </tr>
          </thead>
          <tbody>
            ${PRO_COMPARE.map(
              (row) =>
                html`<tr>
                  <th scope="row">${row.what}</th>
                  <td>${row.kanto}</td>
                  <td>${row.template}</td>
                  <td>${row.pro}</td>
                </tr>`,
            )}
          </tbody>
        </table>
      </div>
      <p class="pro-compare-note">
        The free ones stay free: <a href="#/guide/introduction">Kanto</a> and
        <a href="#/templates/saas">the SaaS template</a>, MIT.
      </p>
    </section>

    <section class="home-band" aria-labelledby="pro-pricing">
      <kt-card class="pro-price">
        <div slot="header">
          <h2 id="pro-pricing">${pro.name}</h2>
          <p class="pro-price-figure">€${pro.price}<span>, once</span></p>
        </div>
        <ul class="pro-price-list">
          ${[
            'The private repository, and every update after',
            'Every option: three databases, two payment providers, Google and GitHub',
            'The guides, AGENTS.md, and a test suite on every engine',
            'As many products of your own as you like',
          ].map(
            (line) =>
              html`<li><kt-icon name="check" size="16" aria-hidden="true"></kt-icon>${line}</li>`,
          )}
        </ul>
        <p class="pro-price-licence">
          One developer per licence. Build for yourself or a client; do not resell the starter.
        </p>
        <div slot="footer">${buy(pro, 'medium')}</div>
      </kt-card>
    </section>

    <section class="home-band home-faq" aria-labelledby="pro-questions">
      <h2 id="pro-questions">Before you buy</h2>
      <kt-accordion>
        ${PRO_QUESTIONS.map(
          (question) =>
            html`<kt-collapsible heading=${question.heading}
              ><p>${question.answer}</p></kt-collapsible
            >`,
        )}
      </kt-accordion>
    </section>
  </div>`;
}

/** After the purchase: Polar sends the buyer here (`#/pro/thanks?checkout_id=…`), with what to do next. */
export function proThanksPage(pro: Pro = PRO): TemplateResult {
  const repo = `https://github.com/${pro.repository}`;
  return html`<div class="home pro">
    <section class="home-hero pro-hero" aria-labelledby="pro-thanks">
      <div class="home-hero-text">
        <p class="pro-name">${pro.name}</p>
        <h1 id="pro-thanks">Thank you. It is yours.</h1>
        <p class="home-lead">
          Polar has sent your receipt, and GitHub an invitation to the private repository. Three
          steps and you are writing your product.
        </p>
      </div>
    </section>
    <section class="home-band" aria-labelledby="pro-next">
      <h2 id="pro-next">What to do now</h2>
      <ol class="pro-next">
        <li>
          <h3>Accept the invitation</h3>
          <p>
            It is in your email and on <a href=${`${repo}/invitations`}>${pro.repository}</a>, for
            the GitHub account you gave at checkout.
          </p>
        </li>
        <li>
          <h3>Make it yours</h3>
          ${code(`git clone git@github.com:${pro.repository}.git my-saas\ncd my-saas\nnpm install\nnpm run setup`, 'bash')}
        </li>
        <li>
          <h3>Write your product</h3>
          <p>
            <code>docs/your-product.md</code> shows where it goes; <code>AGENTS.md</code> tells your
            AI agent the same. A question, a bug: open an issue on the repository.
          </p>
        </li>
      </ol>
    </section>
  </div>`;
}
