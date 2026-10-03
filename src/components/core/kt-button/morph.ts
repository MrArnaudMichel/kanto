/**
 * The geometry for turning the send plane into a spinner and back: both
 * shapes as the same number of points, so any moment between them is just
 * each point part of the way from one to the other. Coordinates are in the
 * 24-unit box Lucide draws in.
 */
export type Point = readonly [number, number];

/**
 * Lucide's `send` outline, its corners taken as points: the half-unit arcs
 * at the tips are lost under a 2-unit round-joined stroke. From the tail,
 * round the nose, back to the fold.
 */
export const PLANE: readonly Point[] = [
  [14.536, 21.686],
  [15.473, 21.662],
  [21.973, 2.662],
  [21.338, 2.027],
  [2.338, 8.527],
  [2.314, 9.464],
  [10.244, 12.644],
  [11.356, 13.754],
];

/** The plane's fold, which fades as it becomes a ring. */
export const FOLD = 'M21.854 2.147L10.914 13.086';

/** How many points both shapes are drawn with. */
export const POINTS = 64;

const CENTRE: Point = [12, 12];
const RADIUS = 9;

/** Twice the signed area: its sign is the way round the outline goes. */
function winding(points: readonly Point[]): number {
  let sum = 0;
  points.forEach(([x, y], i) => {
    const [nx, ny] = points[(i + 1) % points.length]!;
    sum += x * ny - nx * y;
  });
  return Math.sign(sum);
}

/** The angle the plane's first point sits at, so the ring starts there too. */
export const PLANE_START = Math.atan2(PLANE[0]![1] - CENTRE[1], PLANE[0]![0] - CENTRE[0]);

/** `count` points evenly spaced round a closed outline, from its first point. */
export function resample(outline: readonly Point[], count: number): Point[] {
  const edges = outline.map((point, i) => {
    const next = outline[(i + 1) % outline.length]!;
    return { from: point, to: next, length: Math.hypot(next[0] - point[0], next[1] - point[1]) };
  });
  const total = edges.reduce((sum, edge) => sum + edge.length, 0);
  const out: Point[] = [];
  let edge = 0;
  let walked = 0;
  for (let i = 0; i < count; i += 1) {
    const at = (total * i) / count;
    while (walked + edges[edge]!.length < at) walked += edges[edge++]!.length;
    const { from, to, length } = edges[edge]!;
    const t = length ? (at - walked) / length : 0;
    out.push([from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t]);
  }
  return out;
}

/** `count` points round the spinner's ring, from `start`, the plane's way round. */
export function circle(count: number, start: number): Point[] {
  const way = winding(PLANE) || 1;
  return Array.from({ length: count }, (_, i) => {
    const angle = start + (way * 2 * Math.PI * i) / count;
    return [CENTRE[0] + RADIUS * Math.cos(angle), CENTRE[1] + RADIUS * Math.sin(angle)];
  });
}

/** Each point of `from` part of the way, `t`, towards the same point of `to`. */
export function mix(from: readonly Point[], to: readonly Point[], t: number): Point[] {
  return from.map(([x, y], i) => [x + (to[i]![0] - x) * t, y + (to[i]![1] - y) * t]);
}

/** One closed path through the points. */
export function pathOf(points: readonly Point[]): string {
  const at = ([x, y]: Point) => `${Number(x.toFixed(3))} ${Number(y.toFixed(3))}`;
  return `M${points.map(at).join('L')}Z`;
}
