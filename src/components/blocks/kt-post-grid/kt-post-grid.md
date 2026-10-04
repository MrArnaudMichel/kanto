# `<kt-post-grid>`

The latest posts, each a card that leads to it: a cover, a title, a line, and
who wrote it when.

```html
<kt-post-grid id="latest" heading="From the blog">
  <a slot="more" href="/blog">Every post</a>
</kt-post-grid>
<script>
  latest.posts = [
    {
      title: 'Closing the month in a day',
      href: '/blog/close',
      excerpt: 'What changed when the bank feed matched itself.',
      date: '2026-09-14',
      image: '/covers/close.jpg',
      author: { name: 'Ada Park', avatar: '/ada.jpg' },
      tags: ['Finance'],
    },
  ];
</script>
```

## Posts

| Field      | What it is                                                  |
| ---------- | ----------------------------------------------------------- |
| `title`    | The post's title, a link to it — the whole card answers it. |
| `href`     | Where the post is.                                          |
| `excerpt`  | Optional: a line on what it says.                           |
| `date`     | Optional: when it was published, `2026-09-14`.              |
| `image`    | Optional: a cover, cropped to 16:9.                         |
| `imageAlt` | Optional: the cover's text alternative; empty by default.   |
| `author`   | Optional: `{ name, avatar }`.                               |
| `tags`     | Optional: a few words over the title.                       |

Dates are written for people — Sep 14, 2026 — in `locale`, the page's
language when it is empty, and kept for machines in a `<time datetime>`.

## Layout

`grid`, the default, sets the posts in `columns` — 3 or 2 — where there is
room: two at most under 760px, one under 520px. `list` puts one under
another, the cover beside the words once the block is 640px wide. The
`more` slot sits under the posts: a link to every one.

## Accessibility

A section named by its heading, an `<h2>` by default (`heading-level`). The
posts are a list of `<article>`s; each title is a link one level under the
heading. A cover is decoration unless given `imageAlt` — the title already
says what the post is.

## API

| Property       | Attribute       | Type                  | Default    |
| -------------- | --------------- | --------------------- | ---------- |
| `heading`      | `heading`       | `string`              | `''`       |
| `lead`         | `lead`          | `string`              | `''`       |
| `posts`        | —               | `KtPost[]`            | `[]`       |
| `columns`      | `columns`       | `2 \| 3`              | `3`        |
| `layout`       | `layout`        | `'grid' \| 'list'`    | `'grid'`   |
| `locale`       | `locale`        | `string`              | `''`       |
| `align`        | `align`         | `'center' \| 'start'` | `'center'` |
| `headingLevel` | `heading-level` | `number`              | `2`        |
