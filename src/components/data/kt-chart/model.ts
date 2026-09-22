/**
 * The shapes `<kt-chart>` accepts, and the few internal ones its renderers
 * share. Kept apart from the element so the renderers can import them without
 * importing the element.
 */

export type KtChartType =
  'line' | 'area' | 'bar' | 'scatter' | 'bubble' | 'pie' | 'doughnut' | 'polar-area' | 'radar';

/** The marks a cartesian series can be drawn as. */
export type KtMark = 'line' | 'area' | 'bar';

export interface KtPoint {
  readonly x: number;
  readonly y: number;
  /** Bubble size, as a value. Drawn as area, not as a pixel radius. */
  readonly r?: number;
  /** Named in the tooltip and the table instead of the coordinates alone. */
  readonly label?: string;
}

export interface KtSeries {
  readonly name: string;
  /** One value per label. Every type except scatter and bubble. */
  readonly values?: readonly number[];
  /** Scatter and bubble. */
  readonly points?: readonly KtPoint[];
  /** Pins the hue instead of taking the slot for this position. */
  readonly color?: string;
  /** Cartesian only: draws this series as another mark — a line over bars. */
  readonly type?: KtMark;
}

/** The rectangle the marks are drawn in, inside the axes. */
export interface PlotBox {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** Width of a string in the axis font, in px. */
export type Measure = (text: string) => number;

/** Formats a value for an axis, the tooltip or the table. */
export type Format = (value: number) => string;
