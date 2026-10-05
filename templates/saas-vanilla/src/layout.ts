/** The app's frame — header, navigation, account menu — around a page. */
import type { KtSubMenuNavigation, KtUserMenu } from 'kanto-ds';
import { currentSession, signOut } from './auth';
import { APP_NAME, NAV, USER_MENU } from './content';
import { navigate } from './router';

type Page = (page: HTMLElement) => void | (() => void);

export function inShell(path: string, render: Page) {
  return (outlet: HTMLElement): void | (() => void) => {
    outlet.innerHTML = `<kt-app-shell class="app">
      <div slot="header" class="app-header">
        <a class="app-brand" href="#/"></a>
        <kt-user-menu></kt-user-menu>
      </div>
      <kt-sub-menu-navigation slot="sidebar" label="Workspace"></kt-sub-menu-navigation>
      <div class="page"></div>
    </kt-app-shell>`;
    outlet.querySelector('.app-brand')!.textContent = APP_NAME;
    outlet.querySelector('kt-app-shell')!.setAttribute('label', APP_NAME);

    const nav = outlet.querySelector<KtSubMenuNavigation>('kt-sub-menu-navigation')!;
    nav.sections = NAV;
    nav.activeHref = `#${path}`;

    const session = currentSession();
    const menu = outlet.querySelector<KtUserMenu>('kt-user-menu')!;
    menu.name = session?.name ?? '';
    menu.email = session?.email ?? '';
    menu.items = USER_MENU;
    menu.addEventListener('kt-select', (event) => {
      const { id } = (event as CustomEvent<{ id: string }>).detail;
      if (id === 'sign-out') {
        signOut();
        navigate('/sign-in');
      } else navigate('/settings');
    });

    return render(outlet.querySelector<HTMLElement>('.page')!);
  };
}
