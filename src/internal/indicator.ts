import type { ReactiveController, ReactiveControllerHost } from 'lit';

/**
 * One mark that slides to whichever item is selected — a tab's underline, a
 * segmented control's surface — rather than one per item that blinks from
 * the old to the new.
 *
 * It measures the selected item against its container and writes the box to
 * the container as `--kt-indicator-x`, `-y`, `-width` and `-height`. The
 * container's `data-indicator` says where things stand: absent while nothing
 * is selected, `placed` once the mark is under the item, `ready` a frame
 * later. A component transitions the mark only when `ready`, so a page opens
 * with the mark in place, not sliding in from the corner.
 *
 * It slides only when the selection moves to another item. When the same item
 * changes size — the brand font replacing the fallback, a label rewritten —
 * the mark follows at once: growing towards its item would read as a glitch.
 */
export interface IndicatorOptions {
  readonly container: () => HTMLElement | null | undefined;
  readonly selected: () => HTMLElement | null | undefined;
}

export class IndicatorController implements ReactiveController {
  private observer: ResizeObserver | null = null;
  private observed: HTMLElement[] = [];
  private frame = 0;
  private placed: { item: HTMLElement; box: string } | null = null;

  constructor(
    host: ReactiveControllerHost,
    private readonly options: IndicatorOptions,
  ) {
    host.addController(this);
  }

  hostConnected(): void {
    // Labels change width as fonts load and text changes; follow them.
    if (typeof ResizeObserver === 'function')
      this.observer ??= new ResizeObserver(() => this.place());
  }

  hostDisconnected(): void {
    this.observer?.disconnect();
    this.observed = [];
    this.placed = null;
    cancelAnimationFrame(this.frame);
  }

  hostUpdated(): void {
    this.place();
  }

  private place(): void {
    const container = this.options.container();
    if (!container) return;
    const selected = this.options.selected();
    this.observe(container, selected);

    if (!selected) {
      delete container.dataset.indicator;
      this.placed = null;
      return;
    }
    const box = [
      selected.offsetLeft,
      selected.offsetTop,
      selected.offsetWidth,
      selected.offsetHeight,
    ];
    const key = box.join(' ');
    if (this.placed?.item === selected && this.placed.box === key) return;
    // The same item, a new size: follow it without sliding.
    const resized = this.placed?.item === selected;
    this.placed = { item: selected, box: key };

    const style = container.style;
    style.setProperty('--kt-indicator-x', `${box[0]}px`);
    style.setProperty('--kt-indicator-y', `${box[1]}px`);
    style.setProperty('--kt-indicator-width', `${box[2]}px`);
    style.setProperty('--kt-indicator-height', `${box[3]}px`);

    if (!container.dataset.indicator || resized) {
      container.dataset.indicator = 'placed';
      cancelAnimationFrame(this.frame);
      this.frame = requestAnimationFrame(() => {
        if (container.dataset.indicator === 'placed') container.dataset.indicator = 'ready';
      });
    }
  }

  private observe(...elements: (HTMLElement | null | undefined)[]): void {
    if (!this.observer) return;
    const wanted = elements.filter((element): element is HTMLElement => Boolean(element));
    if (wanted.length === this.observed.length && wanted.every((el, i) => el === this.observed[i]))
      return;
    this.observer.disconnect();
    for (const element of wanted) this.observer.observe(element);
    this.observed = wanted;
  }
}
