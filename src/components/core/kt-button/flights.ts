/**
 * How an icon leaves a button when its action is done, and comes back.
 *
 * Most icons have no story to tell and fade; a few do. A paper plane takes a
 * breath back, then flies off to the top right. Keyed by the Lucide name.
 */
export interface Flight {
  /** While the action runs: the icon stays and does this, instead of a spinner. */
  readonly waiting?: 'hover';
  /** On success, before the tick. */
  readonly leave: Keyframe[];
  /** Back to rest, a moment later. */
  readonly back: Keyframe[];
}

const FADE: Flight = {
  leave: [
    { opacity: 1, scale: 1 },
    { opacity: 0, scale: 0.6 },
  ],
  back: [
    { opacity: 0, scale: 0.6 },
    { opacity: 1, scale: 1 },
  ],
};

const PLANE: Flight = {
  waiting: 'hover',
  leave: [
    { translate: '0 0', rotate: '0deg', opacity: 1 },
    // A breath back before it goes.
    { translate: '-0.15em 0.15em', rotate: '-6deg', opacity: 1, offset: 0.2 },
    { translate: '1.6em -1.6em', rotate: '10deg', opacity: 0 },
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
