import type { KtEmptyPage } from 'kanto-ds';
import { currentSession, markWelcomed } from '../auth';
import { APP_NAME, FIRST_STEPS } from '../content';
import { navigate } from '../router';

export function welcomePage(page: HTMLElement): void {
  page.innerHTML = `<kt-empty-page><a slot="actions" class="skip" href="#/">Skip for now</a></kt-empty-page>`;
  const welcome = page.querySelector<KtEmptyPage>('kt-empty-page')!;
  welcome.heading = `Welcome, ${currentSession()?.name ?? 'there'}`;
  welcome.lead = `A few steps and ${APP_NAME} is ready to send invoices.`;
  welcome.steps = FIRST_STEPS;
  welcome.addEventListener('kt-step', (event) => {
    if ((event as CustomEvent<{ id: string }>).detail.id === 'overview') {
      markWelcomed();
      navigate('/');
    }
  });
  page.querySelector('.skip')!.addEventListener('click', () => markWelcomed());
}
