import { describe, expect, it, vi } from 'vitest';
import { fixture, settle } from '#test/fixture';
import './kt-auth-form.js';
import type { KtAuthForm, KtAuthSubmitDetail } from 'kanto-ds';

const root = (el: KtAuthForm) => el.shadowRoot!;
const field = (el: KtAuthForm, name: string) =>
  root(el).querySelector<HTMLElement & { value: string; error: string; autocomplete: string }>(
    `kt-input[name="${name}"]`,
  );
const heading = (el: KtAuthForm) => root(el).querySelector('h1, h2, h3')!.textContent!.trim();
const action = (el: KtAuthForm, text: string) =>
  [...root(el).querySelectorAll<HTMLElement>('button, kt-button')].find(
    (node) => node.textContent!.trim() === text,
  )!;

async function fill(el: KtAuthForm, values: Record<string, string>) {
  for (const [name, value] of Object.entries(values)) field(el, name)!.value = value;
  await settle(el);
}

function submit(el: KtAuthForm) {
  root(el)
    .querySelector('form')!
    .dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
}

describe('kt-auth-form', () => {
  it('signs in by default: email, password, and the way to the others', async () => {
    const el = await fixture<KtAuthForm>('<kt-auth-form></kt-auth-form>');
    expect(el.getAttribute('mode')).toBe('sign-in');
    expect(heading(el)).toBe('Sign in');
    expect(field(el, 'email')!.autocomplete).toBe('email');
    expect(field(el, 'password')!.autocomplete).toBe('current-password');
    expect(action(el, 'Forgot password?')).toBeDefined();
    expect(root(el).textContent).toContain('Create an account');
  });

  it('asks a new account for a name and a new password', async () => {
    const el = await fixture<KtAuthForm>('<kt-auth-form mode="sign-up"></kt-auth-form>');
    expect(heading(el)).toBe('Create an account');
    expect(field(el, 'name')).not.toBeNull();
    expect(field(el, 'password')!.autocomplete).toBe('new-password');
  });

  it('asks only for the email to reset a password', async () => {
    const el = await fixture<KtAuthForm>('<kt-auth-form mode="forgot"></kt-auth-form>');
    expect(field(el, 'email')).not.toBeNull();
    expect(field(el, 'password')).toBeNull();
  });

  it('asks for a one-time code', async () => {
    const el = await fixture<KtAuthForm>('<kt-auth-form mode="code"></kt-auth-form>');
    expect(root(el).querySelector('kt-otp-input')).not.toBeNull();
  });

  it('moves between modes from its links, and says so', async () => {
    const el = await fixture<KtAuthForm>('<kt-auth-form></kt-auth-form>');
    const moved = vi.fn();
    el.addEventListener('kt-mode', moved);
    action(el, 'Forgot password?').click();
    await settle(el);
    expect(el.mode).toBe('forgot');
    expect(moved.mock.calls[0]![0].detail).toEqual({ mode: 'forgot' });
  });

  it('says what is missing instead of sending, and sends nothing', async () => {
    const el = await fixture<KtAuthForm>('<kt-auth-form></kt-auth-form>');
    const sent = vi.fn();
    el.addEventListener('kt-submit', sent);
    await fill(el, { email: 'not-an-email' });
    submit(el);
    await settle(el);
    expect(sent).not.toHaveBeenCalled();
    expect(field(el, 'email')!.error).not.toBe('');
    expect(field(el, 'password')!.error).not.toBe('');
  });

  it('sends what was written, with the mode', async () => {
    const el = await fixture<KtAuthForm>('<kt-auth-form></kt-auth-form>');
    let detail: KtAuthSubmitDetail | undefined;
    el.addEventListener(
      'kt-submit',
      (event) => (detail = (event as CustomEvent<KtAuthSubmitDetail>).detail),
    );
    await fill(el, { email: 'dana@northwind.io', password: 'correct horse' });
    submit(el);
    expect(detail!.mode).toBe('sign-in');
    expect(detail!.values).toMatchObject({ email: 'dana@northwind.io', password: 'correct horse' });
  });

  it('shows what went wrong when the sending it was handed fails', async () => {
    const el = await fixture<KtAuthForm>('<kt-auth-form></kt-auth-form>');
    el.addEventListener('kt-submit', (event) =>
      (event as CustomEvent<KtAuthSubmitDetail>).detail.wait(
        Promise.reject(new Error('That email and password do not match.')),
      ),
    );
    await fill(el, { email: 'dana@northwind.io', password: 'wrong' });
    submit(el);
    await vi.waitFor(() =>
      expect(root(el).querySelector('kt-alert')?.getAttribute('description')).toBe(
        'That email and password do not match.',
      ),
    );
  });

  it('says the reset link is on its way once it is', async () => {
    const el = await fixture<KtAuthForm>('<kt-auth-form mode="forgot"></kt-auth-form>');
    el.addEventListener('kt-submit', (event) =>
      (event as CustomEvent<KtAuthSubmitDetail>).detail.wait(Promise.resolve()),
    );
    await fill(el, { email: 'dana@northwind.io' });
    submit(el);
    await vi.waitFor(() => expect(root(el).textContent).toContain('Check your email'));
  });

  it('offers its providers, and says which was chosen', async () => {
    const el = await fixture<KtAuthForm>('<kt-auth-form></kt-auth-form>');
    el.providers = [{ id: 'github', label: 'Continue with GitHub' }];
    await settle(el);
    const chose = vi.fn();
    el.addEventListener('kt-provider', chose);
    action(el, 'Continue with GitHub').click();
    expect(chose.mock.calls[0]![0].detail).toEqual({ id: 'github' });
  });

  it('takes its words from texts, and its heading level', async () => {
    const el = await fixture<KtAuthForm>('<kt-auth-form heading-level="2"></kt-auth-form>');
    el.texts = { signInHeading: 'Connexion', email: 'Adresse e-mail' };
    await settle(el);
    expect(root(el).querySelector('h2')!.textContent!.trim()).toBe('Connexion');
    expect(root(el).querySelector('kt-label-input')!.getAttribute('label')).toBe('Adresse e-mail');
  });
});
