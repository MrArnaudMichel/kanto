# Webfonts

| Family           | Files                        | Licence                                          |
| ---------------- | ---------------------------- | ------------------------------------------------ |
| Gilroy           | `gilroy/*.ttf`               | **Commercial** — Radomir Tinkov. Not open source. |
| Avenir Next Cyr  | `avenir_next/*.woff2`        | **Commercial** — Linotype/Monotype.               |
| Source Code Pro  | `source_code_pro/*.woff2`    | SIL Open Font License 1.1 (Adobe).                |

Gilroy and Avenir Next are bundled here because Kanto is currently consumed
inside applications covered by the existing licences. **They are not covered by
this repository's MIT licence** and must not be redistributed with a public npm
release — check the licence terms first, or drop `fonts.css` and let the
`--font-family-*` fallback stacks take over.

The token layer is designed for exactly that: `typography.css` never names a
family directly, so replacing the two commercial faces is a one-line change.
