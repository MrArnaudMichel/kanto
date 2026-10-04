# `<kt-blog-post>`

A post, set to be read: its title, who wrote it and when, a cover, and the
body in a measure an eye can follow.

```html
<kt-blog-post
  heading="Closing the month in a day"
  lead="What changed when the bank feed matched itself."
  author="Ada Park"
  author-role="CFO, Northwind"
  date="2026-09-14"
  back-href="/blog"
>
  <img slot="cover" src="/covers/close.jpg" alt="" />
  <p>For years, the first week of every month was the close.</p>
  <h2>What we changed</h2>
  <p>…</p>
  <div slot="end">
    Filed under Finance. <a href="/blog/reminders">Next: reminders that get paid</a>
  </div>
</kt-blog-post>
```

## The body

The body is the default slot, and its elements are set as prose: paragraphs,
`<h2>` and `<h3>`, lists, quotes, `<pre>` and `<kt-code>`, images, figures and
rules — in a column `--kt-post-measure` wide, 68 characters by default. What
is inside them — links, emphasis, code — takes the page's own styles.

## Who and when

`author`, `author-role` and `avatar` say who wrote it; `date` when, written
for people in `locale` — Sep 14, 2026 — and kept for machines in a
`<time datetime>`. The reading time is counted from the body, at 230 words a
minute, unless `reading-time` gives one. `tags` sit over the title;
`back-href` adds a link to every post.

## Slots

| Slot      | What goes in it                                            |
| --------- | ---------------------------------------------------------- |
| (default) | The body.                                                  |
| `cover`   | Under the header, wider than the body: an image, a figure. |
| `end`     | After the body, over a rule: tags, sharing, the next post. |

## Words

```js
post.texts = { back: 'Tous les articles', minRead: (minutes) => `${minutes} min de lecture` };
```

## Accessibility

An `<article>` named by its title — an `<h1>`, since the post is the page;
`heading-level` changes it. Headings in the body should start at `<h2>`. The
avatar repeats the author's name, so it is hidden from assistive tech; a
cover that only illustrates takes `alt=""`.

## API

| Property       | Attribute       | Type                       | Default |
| -------------- | --------------- | -------------------------- | ------- |
| `heading`      | `heading`       | `string`                   | `''`    |
| `lead`         | `lead`          | `string`                   | `''`    |
| `date`         | `date`          | `string`                   | `''`    |
| `author`       | `author`        | `string`                   | `''`    |
| `authorRole`   | `author-role`   | `string`                   | `''`    |
| `avatar`       | `avatar`        | `string`                   | `''`    |
| `readingTime`  | `reading-time`  | `number`                   | `0`     |
| `tags`         | —               | `string[]`                 | `[]`    |
| `backHref`     | `back-href`     | `string`                   | `''`    |
| `locale`       | `locale`        | `string`                   | `''`    |
| `headingLevel` | `heading-level` | `number`                   | `1`     |
| `texts`        | —               | `Partial<KtBlogPostTexts>` | `{}`    |
