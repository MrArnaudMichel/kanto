import { useNavigate } from 'react-router';
import { signIn, signUp } from '../auth';
import { APP_NAME } from '../content';

export function AuthPage({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const navigate = useNavigate();
  return (
    <main className="auth">
      <kt-auth-form
        mode={mode}
        onkt-submit={(event) => {
          const { mode: sent, values, wait } = event.detail;
          if (sent === 'sign-in') wait(signIn(values).then(() => navigate('/')));
          else if (sent === 'sign-up') wait(signUp(values).then(() => navigate('/welcome')));
          else wait(new Promise((resolve) => setTimeout(resolve, 500)));
        }}
        onkt-mode={(event) => {
          const next = event.detail.mode;
          if (next === 'sign-in' || next === 'sign-up') navigate(`/${next}`);
        }}
      >
        <a slot="logo" className="app-brand" href="#/">
          {APP_NAME}
        </a>
        <p slot="footer" className="auth-note">
          A demo: any email and password sign in.
        </p>
      </kt-auth-form>
    </main>
  );
}
