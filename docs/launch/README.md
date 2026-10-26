# Launch kit

Texts to make Kanto found, ready for a person to post. Nothing here is posted
by a script; each file says where it goes and when.

| File                                 | Where                                                   |
| ------------------------------------ | ------------------------------------------------------- |
| [show-hn.md](show-hn.md)             | Hacker News, "Show HN" — a weekday, 8–10am US Eastern   |
| [product-hunt.md](product-hunt.md)   | Product Hunt — launches at 00:01 Pacific                |
| [article.md](article.md)             | dev.to, Medium or the blog, then linked from the others |
| [awesome-lists.md](awesome-lists.md) | Pull requests to curated lists, one line each           |

## Before posting

- The site is on real addresses and its pages are prerendered: check that
  `https://kanto.arnaudmichel.fr/components/kt-table/` opens directly, and
  that `https://kanto.arnaudmichel.fr/sitemap.xml` lists the pages.
- Submit the sitemap in Google Search Console and Bing Webmaster Tools
  (each asks to verify the domain once, by a DNS record).
- `npx -y kanto-mcp` answers: kanto-mcp is on npm.

## GitHub: description and topics

The repository's description still says forty-nine components. To bring it
and the topics up to date (run by hand, once approved):

```sh
gh repo edit MrArnaudMichel/kanto \
  --description "Eighty accessible web components for dashboards, admin tools and forms — themeable in one line, in React, Vue, Angular, Svelte or plain HTML." \
  --add-topic ui-library --add-topic component-library --add-topic typescript \
  --add-topic angular --add-topic svelte --add-topic dark-mode \
  --add-topic data-table --add-topic date-picker --add-topic mcp-server \
  --add-topic llms-txt --add-topic admin-dashboard
```

GitHub allows twenty topics; this makes twenty-two with the eleven already
there, so drop two — `webcomponents` duplicates `web-components`, and
`--remove-topic webcomponents --remove-topic ui-components` keeps the rest.
