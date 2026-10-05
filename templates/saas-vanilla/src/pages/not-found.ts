export function notFoundPage(outlet: HTMLElement): void {
  outlet.innerHTML = '<kt-error-page fill home-href="#/"></kt-error-page>';
}
