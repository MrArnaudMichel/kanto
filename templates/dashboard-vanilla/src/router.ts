/**
 * A hash router in a page of code: `#/customers` renders the customers page.
 * Swap it for a router package when the app outgrows it.
 */
export interface Route {
  readonly path: string;
  /** Draws the page into `outlet`; may return what to undo when leaving it. */
  readonly render: (outlet: HTMLElement) => void | (() => void);
}

export interface RouteTable {
  readonly routes: readonly Route[];
  readonly notFound: Route;
  /** Where a visit should go instead, or null to stay. */
  readonly redirect: (path: string, known: boolean) => string | null;
}

export function currentPath(): string {
  return location.hash.replace(/^#/, '') || '/';
}

export function navigate(path: string): void {
  location.hash = path;
}

export function startRouter(outlet: HTMLElement, table: RouteTable): void {
  let leave: void | (() => void);
  const render = (): void => {
    const path = currentPath();
    const route = table.routes.find((candidate) => candidate.path === path);
    const redirect = table.redirect(path, Boolean(route));
    if (redirect && redirect !== path) {
      navigate(redirect);
      return;
    }
    if (typeof leave === 'function') leave();
    outlet.replaceChildren();
    leave = (route ?? table.notFound).render(outlet);
  };
  window.addEventListener('hashchange', render);
  render();
}
