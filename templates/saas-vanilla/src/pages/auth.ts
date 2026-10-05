import type { KtAuthForm, KtAuthSubmitDetail } from 'kanto-ds';
import { signIn, signUp } from '../auth';
import { APP_NAME } from '../content';
import { navigate } from '../router';

export function authPage(outlet: HTMLElement, mode: 'sign-in' | 'sign-up'): void {
  outlet.innerHTML = `<main class="auth">
    <kt-auth-form>
      <a slot="logo" class="app-brand" href="#/"></a>
      <p slot="footer" class="auth-note">A demo: any email and password sign in.</p>
    </kt-auth-form>
  </main>`;
  outlet.querySelector('.app-brand')!.textContent = APP_NAME;
  const form = outlet.querySelector<KtAuthForm>('kt-auth-form')!;
  form.mode = mode;

  form.addEventListener('kt-submit', (event) => {
    const { mode: sent, values, wait } = (event as CustomEvent<KtAuthSubmitDetail>).detail;
    if (sent === 'sign-in') wait(signIn(values).then(() => navigate('/')));
    else if (sent === 'sign-up') wait(signUp(values).then(() => navigate('/welcome')));
    else wait(new Promise((resolve) => setTimeout(resolve, 500)));
  });
  form.addEventListener('kt-mode', (event) => {
    const { mode: next } = (event as CustomEvent<{ mode: string }>).detail;
    if (next === 'sign-in' || next === 'sign-up') navigate(`/${next}`);
  });
}
