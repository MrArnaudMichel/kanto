import { useNavigate } from 'react-router';
import { currentSession, markWelcomed } from '../auth';
import { APP_NAME, FIRST_STEPS } from '../content';

export function Welcome() {
  const navigate = useNavigate();
  return (
    <kt-empty-page
      heading={`Welcome, ${currentSession()?.name ?? 'there'}`}
      lead={`A few steps and ${APP_NAME} is ready to send invoices.`}
      steps={FIRST_STEPS}
      onkt-step={(event) => {
        if (event.detail.id === 'overview') {
          markWelcomed();
          navigate('/');
        }
      }}
    >
      <a slot="actions" href="#/" onClick={() => markWelcomed()}>
        Skip for now
      </a>
    </kt-empty-page>
  );
}
