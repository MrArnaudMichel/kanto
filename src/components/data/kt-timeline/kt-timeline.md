# `<kt-timeline>`

An ordered run of events on a rail.

```html
<kt-timeline>
  <kt-timeline-item heading="Deployed" time="09:24" variant="success" icon="rocket">
    Build 4210 went to production.
  </kt-timeline-item>
  <kt-timeline-item heading="Review requested" time="09:02" icon="eye">
    Two files, forty lines.
  </kt-timeline-item>
  <kt-timeline-item heading="Branch opened" time="08:41"></kt-timeline-item>
</kt-timeline>
```

The same shape keeps reappearing — an activity feed, an audit log, a changelog,
the stages of a delivery, the roles on a résumé — and every time it gets rebuilt
out of a list, a pseudo-element line and a hand-placed dot.

The fiddly part is the rail. It must start at the first dot and stop at the
last, which a border on the list cannot do: a border runs the full height, so
the line overshoots below the final event. Here each item draws its own segment
hanging below its marker, and the last item drops it. The item cannot work out
on its own that it is last — `:last-child` matches in the light tree, which the
item's own shadow styles cannot reach — so `<kt-timeline>` reads its slot and
sets `last` on the final child, again whenever the list changes.

Without an `icon` the marker is a 9px dot; with one it is a 24px tinted circle.
Mixing the two in one list is fine and reads as emphasis — give the events that
matter an icon and leave the rest as dots.

`variant` only colours the marker. As with every status colour in Kanto, it
never carries the meaning alone: the heading says what happened.

## API

### `<kt-timeline>`

| Property  | Attribute | Type      | Default |
| --------- | --------- | --------- | ------- |
| `compact` | `compact` | `boolean` | `false` |

`compact` is passed down to every item, so set it once on the list.

### `<kt-timeline-item>`

| Property  | Attribute | Type                                                         | Default     |
| --------- | --------- | ------------------------------------------------------------ | ----------- |
| `heading` | `heading` | `string`                                                     | `''`        |
| `time`    | `time`    | `string`                                                     | `''`        |
| `icon`    | `icon`    | `string`                                                     | `''`        |
| `variant` | `variant` | `neutral \| primary \| success \| warning \| danger \| info` | `'neutral'` |
| `last`    | `last`    | `boolean`                                                    | `false`     |

`time` is a free string — `09:24`, `2 days ago`, `June 2026` — because a
timeline is as often a résumé as it is a log. `last` is managed by the parent;
set it yourself only if you are laying items out without `<kt-timeline>`.

| Slot      | Description                                 |
| --------- | ------------------------------------------- |
| _default_ | The body of the event                       |
| `actions` | Trailing controls, aligned with the heading |
