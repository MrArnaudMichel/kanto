/**
 * How an icon leaves a button when its action is done, and comes back.
 *
 * Most icons have no story to tell and fade; a few do. A paper plane takes a
 * breath back, then flies off to the top right. Keyed by the Lucide name.
 */
export interface Flight {
  /** While the action runs, the icon stays, still, instead of a spinner. */
  readonly waitsStill?: boolean;
  /**
   * On success, before the tick. Each keyframe carries the easing of the
   * leg after it; the whole runs on a linear clock.
   */
  readonly leave: Keyframe[];
  /** How many times the slow duration the leaving takes. */
  readonly leaveScale?: number;
  /** Back to rest, a moment later. */
  readonly back: Keyframe[];
}

const FADE: Flight = {
  leave: [
    { opacity: 1, scale: 1, easing: 'ease-in' },
    { opacity: 0, scale: 0.6 },
  ],
  back: [
    { opacity: 0, scale: 0.6 },
    { opacity: 1, scale: 1 },
  ],
};

const PLANE: Flight = {
  waitsStill: true,
  leaveScale: 1.5,
  leave: [
    { translate: '0 0', rotate: '0deg', opacity: 1, easing: 'cubic-bezier(0.2, 0, 0.4, 1)' },
    // A breath back, slowing into it, before it goes.
    {
      translate: '-0.15em 0.15em',
      rotate: '-6deg',
      opacity: 1,
      offset: 0.3,
      easing: 'cubic-bezier(0.55, 0, 0.8, 0.4)',
    },
    // Then off, speeding up, fading only at the end.
    { translate: '1.1em -1.1em', rotate: '6deg', opacity: 1, offset: 0.75 },
    { translate: '1.8em -1.8em', rotate: '10deg', opacity: 0 },
  ],
  back: [
    { translate: '-0.8em 0.8em', opacity: 0 },
    { translate: '0 0', opacity: 1 },
  ],
};

const FLIGHTS: Readonly<Record<string, Flight>> = {
  send: PLANE,
  'send-horizontal': PLANE,
};

export function flightOf(icon: string): Flight {
  return FLIGHTS[icon] ?? FADE;
}

/** The tick or the alert coming in: a small overshoot, then rest. */
export const ARRIVE: Keyframe[] = [
  { opacity: 0, scale: 0.3 },
  { opacity: 1, scale: 1.15, offset: 0.6 },
  { opacity: 1, scale: 1 },
];

/** A no: side to side, settling. */
export const SHAKE: Keyframe[] = [
  { translate: '0' },
  { translate: '-4px' },
  { translate: '4px' },
  { translate: '-3px' },
  { translate: '2px' },
  { translate: '0' },
];
