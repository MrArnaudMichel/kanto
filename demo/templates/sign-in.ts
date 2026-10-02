import type { Template } from './index.js';

export const signIn: Template = {
  slug: 'sign-in',
  name: 'Sign in',
  description: 'A centred sign-in card: email and password, a remembered session, single sign-on.',
  html: `<style>
  .auth {
    display: grid;
    min-height: 100vh;
    place-items: center;
    padding: 24px;
    background: var(--surface-page);
  }
  .auth-card {
    display: grid;
    gap: 20px;
    width: min(400px, 100%);
    padding: 32px;
    background: var(--surface-card);
    border: var(--border-width) solid var(--border-subtle);
    border-radius: var(--radius-modal);
  }
  .auth-card h1 {
    margin: 0;
    color: var(--text-body);
    font: var(--font-title-h4);
  }
  .auth-card p {
    margin: 4px 0 0;
    color: var(--text-muted);
    font: var(--font-normal-regular);
  }
  .auth-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    font: var(--font-normal-small);
  }
  .auth-row a,
  .auth-foot a {
    color: var(--color-primary-text);
  }
  .auth-or {
    display: flex;
    align-items: center;
    gap: 12px;
    color: var(--text-muted);
    font: var(--font-normal-small);
  }
  .auth-or::before,
  .auth-or::after {
    flex: 1;
    height: 1px;
    background: var(--border-subtle);
    content: '';
  }
  .auth-foot {
    color: var(--text-muted);
    font: var(--font-normal-small);
    text-align: center;
  }
</style>

<main class="auth">
  <form class="auth-card" id="sign-in">
    <div>
      <h1>Welcome back</h1>
      <p>Sign in to Northwind to pick up where you left off.</p>
    </div>
    <kt-label-input label="Email" required>
      <kt-input name="email" type="email" placeholder="you@company.com" required></kt-input>
    </kt-label-input>
    <kt-label-input label="Password" required>
      <kt-input name="password" type="password" required></kt-input>
    </kt-label-input>
    <div class="auth-row">
      <kt-checkbox name="remember" checked>Keep me signed in</kt-checkbox>
      <a href="#">Forgot your password?</a>
    </div>
    <kt-button type="submit" variant="primary">Sign in</kt-button>
    <div class="auth-or">or</div>
    <kt-button variant="secondary" id="sso">Continue with single sign-on</kt-button>
    <div class="auth-foot">New to Northwind? <a href="#">Create an account</a></div>
  </form>
</main>`,
  script: `import { toaster } from 'kanto-ds';

document.querySelector('#sign-in').addEventListener('submit', (event) => {
  event.preventDefault();
  const email = new FormData(event.target).get('email');
  toaster.success(\`Signed in as \${email}\`);
});
document.querySelector('#sso').addEventListener('click', () => {
  toaster.info('Redirecting to your identity provider…');
});`,
};
