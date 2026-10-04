import { css, html, nothing, type TemplateResult } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { KtElement, defineElement } from '#internal/kt-element';
import { emit } from '#internal/events';
import { heading } from '#internal/heading';
import '../../core/kt-button/kt-button.js';
import '../../feedback/kt-alert/kt-alert.js';
import '../../forms/kt-checkbox/kt-checkbox.js';
import '../../forms/kt-input/kt-input.js';
import '../../forms/kt-label-input/kt-label-input.js';
import '../../forms/kt-otp-input/kt-otp-input.js';
import type { KtButton } from '../../core/kt-button/kt-button.js';

export type KtAuthMode = 'sign-in' | 'sign-up' | 'forgot' | 'code';

export interface KtAuthProvider {
  readonly id: string;
  /** What the button says: "Continue with GitHub". */
  readonly label: string;
  /** A Lucide icon name, registered by the page. */
  readonly icon?: string;
}

/** Every word the form says, in English until given others. */
export interface KtAuthTexts {
  readonly signInHeading: string;
  readonly signInLead: string;
  readonly signUpHeading: string;
  readonly signUpLead: string;
  readonly forgotHeading: string;
  readonly forgotLead: string;
  readonly codeHeading: string;
  readonly codeLead: string;
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly code: string;
  readonly remember: string;
  readonly forgotLink: string;
  readonly signIn: string;
  readonly signUp: string;
  readonly sendLink: string;
  readonly verify: string;
  readonly toSignUp: string;
  readonly toSignUpLink: string;
  readonly toSignIn: string;
  readonly toSignInLink: string;
  readonly or: string;
  readonly sentHeading: string;
  readonly sentLead: string;
  readonly nameMissing: string;
  readonly emailInvalid: string;
  readonly passwordMissing: string;
  readonly passwordShort: (least: number) => string;
  readonly codeMissing: string;
  readonly failed: string;
}

const TEXTS: KtAuthTexts = {
  signInHeading: 'Sign in',
  signInLead: 'Welcome back. Sign in to carry on.',
  signUpHeading: 'Create an account',
  signUpLead: 'It takes a minute, and no card.',
  forgotHeading: 'Reset your password',
  forgotLead: 'We will email you a link to choose a new one.',
  codeHeading: 'Check your phone',
  codeLead: 'Enter the code we sent you.',
  name: 'Name',
  email: 'Email',
  password: 'Password',
  code: 'Verification code',
  remember: 'Keep me signed in',
  forgotLink: 'Forgot password?',
  signIn: 'Sign in',
  signUp: 'Create account',
  sendLink: 'Send the link',
  verify: 'Verify',
  toSignUp: 'No account yet?',
  toSignUpLink: 'Create an account',
  toSignIn: 'Already have an account?',
  toSignInLink: 'Sign in',
  or: 'or',
  sentHeading: 'Check your email',
  sentLead: 'If an account uses that address, a link to reset its password is on its way.',
  nameMissing: 'Enter your name.',
  emailInvalid: 'Enter an email address, like name@example.com.',
  passwordMissing: 'Enter your password.',
  passwordShort: (least) => `Use at least ${least} characters.`,
  codeMissing: 'Enter the whole code.',
  failed: 'That did not work. Try again in a moment.',
};

/** What `kt-submit` carries: the mode, what was written, and a way to wait for the sending. */
export interface KtAuthSubmitDetail {
  readonly mode: KtAuthMode;
  readonly values: {
    readonly name?: string;
    readonly email?: string;
    readonly password?: string;
    readonly code?: string;
    readonly remember?: boolean;
  };
  /**
   * Hand it the request: the button runs it, and if it rejects, its message
   * is shown above the fields.
   */
  readonly wait: (sending: Promise<unknown>) => void;
}

type Field = HTMLElement & { value: string; error: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * The way into a product: signing in, creating an account, resetting a
 * password, entering a code — one block, four modes.
 *
 * It checks what it can before sending — an email that is one, a password, a
 * name, a whole code — and says so on the field. Then `kt-submit` carries the
 * mode and the values, and `wait(promise)`: the button runs the request, and
 * if it rejects, its message is shown above the fields. A reset that succeeds
 * says the link is on its way.
 *
 * Sign-in providers go in `providers`; the links between modes move the form
 * itself and fire `kt-mode`. Every word is in `texts`, English until given
 * others.
 *
 * @element kt-auth-form
 *
 * @slot logo - Above the heading: the product's mark.
 * @slot footer - Under the form: the terms, a privacy note.
 *
 * @csspart base - The block.
 * @csspart form - The `<form>`.
 *
 * @fires kt-submit - The form was sent. `detail: { mode, values, wait(promise) }`.
 * @fires kt-mode - The form moved to another mode. `detail: { mode }`.
 * @fires kt-provider - A provider was chosen. `detail: { id }`.
 *
 * @example
 * ```html
 * <kt-auth-form remember></kt-auth-form>
 * <script>
 *   form.addEventListener('kt-submit', (e) => e.detail.wait(auth.signIn(e.detail.values)));
 * </script>
 * ```
 */
export class KtAuthForm extends KtElement {
  static override styles = [
    KtElement.styles,
    css`
      :host {
        display: block;
        max-width: 420px;
      }

      .auth {
        display: grid;
        gap: var(--gap-card);
        padding: calc(var(--padding-card) * 1.5);
        background: var(--surface-card);
        border: var(--border-width) solid var(--border-subtle);
        border-radius: var(--border-radius-card);
      }
      :host([plain]) .auth {
        padding: 0;
        background: none;
        border: none;
      }

      .logo:empty {
        display: none;
      }
      .head {
        display: grid;
        gap: 6px;
      }
      .heading {
        margin: 0;
        color: var(--text-body);
        font: var(--font-title-h4);
      }
      .lead {
        margin: 0;
        color: var(--text-muted);
        font: var(--font-normal-regular);
      }

      .providers {
        display: grid;
        gap: var(--gap-button);
      }
      .or {
        display: flex;
        gap: var(--gap-form);
        align-items: center;
        color: var(--text-muted);
        font: var(--font-normal-small);
      }
      .or::before,
      .or::after {
        flex: 1;
        height: var(--border-width);
        background: var(--border-subtle);
        content: '';
      }

      form {
        display: grid;
        gap: var(--gap-form);
        margin: 0;
      }
      .row {
        display: flex;
        flex-wrap: wrap;
        gap: var(--gap-button);
        align-items: center;
        justify-content: space-between;
      }

      .link {
        padding: 0;
        color: var(--color-primary-text);
        font: var(--font-normal-medium);
        background: none;
        border: none;
        border-radius: var(--radius-sub-menu);
        cursor: pointer;
      }
      .link:hover {
        text-decoration: underline;
      }
      .link:focus-visible {
        outline: var(--outline-width) solid var(--color-primary-base);
        outline-offset: 2px;
      }

      .switch {
        margin: 0;
        color: var(--text-muted);
        font: var(--font-normal-regular);
        text-align: center;
      }
      .footer {
        color: var(--text-muted);
        font: var(--font-normal-small);
        text-align: center;
      }
      .footer:empty {
        display: none;
      }
    `,
  ];

  /** `sign-in`, `sign-up`, `forgot` or `code`. */
  @property({ type: String, reflect: true })
  mode: KtAuthMode = 'sign-in';

  /** Sign-in providers, above the fields. Set as a property. */
  @property({ attribute: false })
  providers: readonly KtAuthProvider[] = [];

  /** Shows "Keep me signed in" when signing in. */
  @property({ type: Boolean })
  remember = false;

  /** The shortest password a new account may choose. */
  @property({ type: Number, attribute: 'password-min' })
  passwordMin = 8;

  /** The heading's level, 1 to 6: 1 when the form is the page. */
  @property({ type: Number, attribute: 'heading-level' })
  headingLevel = 1;

  /** Drops the card around it, for a page that frames it already. */
  @property({ type: Boolean, reflect: true })
  plain = false;

  /** An error to show above the fields; a failed sending sets it. */
  @property({ type: String })
  error = '';

  /** The words, English until given others: `form.texts = { signInHeading: 'Connexion' }`. */
  @property({ attribute: false })
  texts: Partial<KtAuthTexts> = {};

  /** A reset link was sent: the form says so instead of asking again. */
  @state() private sent = false;

  @query('kt-button.submit') private button!: KtButton;

  private get t(): KtAuthTexts {
    return { ...TEXTS, ...this.texts };
  }

  /** Moves the form to another mode, as its links do. */
  goTo(mode: KtAuthMode): void {
    if (mode === this.mode) return;
    this.mode = mode;
    this.error = '';
    this.sent = false;
    emit(this, 'kt-mode', { mode });
  }

  private field(name: string): Field | null {
    return this.shadowRoot?.querySelector<Field>(`kt-input[name="${name}"]`) ?? null;
  }

  /** Checks what can be checked before sending; marks each field it finds wanting. */
  private check(): boolean {
    const t = this.t;
    const rules: [string, (value: string) => string][] = [];
    if (this.mode === 'sign-up') rules.push(['name', (v) => (v.trim() ? '' : t.nameMissing)]);
    if (this.mode !== 'code') {
      rules.push(['email', (v) => (EMAIL.test(v.trim()) ? '' : t.emailInvalid)]);
    }
    if (this.mode === 'sign-in') rules.push(['password', (v) => (v ? '' : t.passwordMissing)]);
    if (this.mode === 'sign-up') {
      rules.push([
        'password',
        (v) =>
          !v
            ? t.passwordMissing
            : v.length < this.passwordMin
              ? t.passwordShort(this.passwordMin)
              : '',
      ]);
    }
    let first: Field | null = null;
    for (const [name, rule] of rules) {
      const field = this.field(name);
      if (!field) continue;
      field.error = rule(field.value ?? '');
      if (field.error && !first) first = field;
    }
    if (this.mode === 'code') {
      const otp = this.shadowRoot?.querySelector<Field & { length: number }>('kt-otp-input');
      if (otp) {
        otp.error = otp.value.length < otp.length ? t.codeMissing : '';
        if (otp.error) first = otp;
      }
    }
    first?.focus();
    return !first;
  }

  private values(): KtAuthSubmitDetail['values'] {
    const read = (name: string) => this.field(name)?.value;
    switch (this.mode) {
      case 'sign-up':
        return {
          name: read('name') ?? '',
          email: read('email') ?? '',
          password: read('password') ?? '',
        };
      case 'forgot':
        return { email: read('email') ?? '' };
      case 'code':
        return { code: this.shadowRoot?.querySelector<Field>('kt-otp-input')?.value ?? '' };
      default: {
        const remember = this.shadowRoot?.querySelector<HTMLElement & { checked: boolean }>(
          'kt-checkbox',
        );
        return {
          email: read('email') ?? '',
          password: read('password') ?? '',
          ...(remember ? { remember: remember.checked } : {}),
        };
      }
    }
  }

  /** Sends the form, as its button does, once what it holds checks out. */
  submit(): void {
    if (!this.check()) return;
    this.error = '';
    let sending: Promise<unknown> | null = null;
    emit<KtAuthSubmitDetail>(this, 'kt-submit', {
      mode: this.mode,
      values: this.values(),
      wait: (promise) => {
        sending = promise;
      },
    });
    if (!sending) return;
    const waited: Promise<unknown> = sending;
    const mode = this.mode;
    void this.button
      .run(() => waited)
      .then(
        () => {
          if (mode === 'forgot' && this.mode === 'forgot') this.sent = true;
        },
        (reason: unknown) => {
          this.error = reason instanceof Error && reason.message ? reason.message : this.t.failed;
        },
      );
  }

  private onSubmit(event: Event): void {
    event.preventDefault();
    this.submit();
  }

  /** Enter in a field sends, as in any form: the native field is inside the kt-input. */
  private onKeyDown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' || event.isComposing) return;
    const from = event.composedPath()[0] as Element;
    if (from.localName !== 'input') return;
    event.preventDefault();
    this.submit();
  }

  private input(name: string, label: string, type: string, autocomplete: string): TemplateResult {
    return html`<kt-label-input label=${label}>
      <kt-input
        name=${name}
        type=${type}
        autocomplete=${autocomplete}
        @kt-input=${(event: Event) => ((event.currentTarget as Field).error = '')}
      ></kt-input>
    </kt-label-input>`;
  }

  private fields(): TemplateResult {
    const t = this.t;
    switch (this.mode) {
      case 'sign-up':
        return html`${this.input('name', t.name, 'text', 'name')}
        ${this.input('email', t.email, 'email', 'email')}
        ${this.input('password', t.password, 'password', 'new-password')}`;
      case 'forgot':
        return this.input('email', t.email, 'email', 'email');
      case 'code':
        return html`<kt-otp-input
          label=${t.code}
          @kt-complete=${() => this.submit()}
        ></kt-otp-input>`;
      default:
        return html`${this.input('email', t.email, 'email', 'email')}
          ${this.input('password', t.password, 'password', 'current-password')}
          <div class="row">
            ${this.remember ? html`<kt-checkbox>${t.remember}</kt-checkbox>` : html`<span></span>`}
            <button type="button" class="link" @click=${() => this.goTo('forgot')}>
              ${t.forgotLink}
            </button>
          </div>`;
    }
  }

  private head(title: string, lead: string): TemplateResult {
    return html`<div class="head">
      ${heading(this.headingLevel, title, 'heading', 1)}
      <p class="lead">${lead}</p>
    </div>`;
  }

  override render(): TemplateResult {
    const t = this.t;
    const words: Record<KtAuthMode, readonly [string, string, string]> = {
      'sign-in': [t.signInHeading, t.signInLead, t.signIn],
      'sign-up': [t.signUpHeading, t.signUpLead, t.signUp],
      forgot: [t.forgotHeading, t.forgotLead, t.sendLink],
      code: [t.codeHeading, t.codeLead, t.verify],
    };
    const [title, lead, send] = words[this.mode];
    const providers =
      this.providers.length > 0 && (this.mode === 'sign-in' || this.mode === 'sign-up');

    if (this.sent) {
      return html`<section part="base" class="auth">
        <div class="logo"><slot name="logo"></slot></div>
        ${this.head(t.sentHeading, t.sentLead)}
        <p class="switch">
          <button type="button" class="link" @click=${() => this.goTo('sign-in')}>
            ${t.toSignInLink}
          </button>
        </p>
      </section>`;
    }

    return html`<section part="base" class="auth">
      <div class="logo"><slot name="logo"></slot></div>
      ${this.head(title, lead)}
      ${
        this.error
          ? html`<kt-alert variant="danger" description=${this.error}></kt-alert>`
          : nothing
      }
      ${
        providers
          ? html`<div class="providers">
                ${this.providers.map(
                  (provider) =>
                    html`<kt-button
                      variant="secondary"
                      full-width
                      icon=${provider.icon || nothing}
                      @click=${() => emit(this, 'kt-provider', { id: provider.id })}
                      >${provider.label}</kt-button
                    >`,
                )}
              </div>
              <div class="or">${t.or}</div>`
          : nothing
      }
      <form part="form" novalidate @submit=${this.onSubmit} @keydown=${this.onKeyDown}>
        ${this.fields()}
        <kt-button class="submit" full-width @click=${() => this.submit()}>${send}</kt-button>
      </form>
      ${
        this.mode === 'sign-in'
          ? html`<p class="switch">
              ${t.toSignUp}
              <button type="button" class="link" @click=${() => this.goTo('sign-up')}>
                ${t.toSignUpLink}
              </button>
            </p>`
          : html`<p class="switch">
              ${this.mode === 'sign-up' ? t.toSignIn : nothing}
              <button type="button" class="link" @click=${() => this.goTo('sign-in')}>
                ${t.toSignInLink}
              </button>
            </p>`
      }
      <div class="footer"><slot name="footer"></slot></div>
    </section>`;
  }
}

defineElement('kt-auth-form', KtAuthForm);

declare global {
  interface HTMLElementTagNameMap {
    'kt-auth-form': KtAuthForm;
  }
}
