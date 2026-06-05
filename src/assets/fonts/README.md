# Webfonts

| Family          | Role          | Files                     | Licence                                    |
| --------------- | ------------- | ------------------------- | ------------------------------------------ |
| Manrope         | Display       | `manrope/*.woff2`         | SIL Open Font License 1.1 — `manrope/OFL.txt` |
| Mulish          | Body / UI     | `mulish/*.woff2`          | SIL Open Font License 1.1 — `mulish/OFL.txt`  |
| Source Code Pro | Code          | `source_code_pro/*.woff2` | SIL Open Font License 1.1 — `source_code_pro/OFL.txt` |

All three may be redistributed with the package. Each licence file must travel
with its fonts.

Manrope and Mulish are variable fonts (one file covers every weight), taken from
[Fontsource](https://fontsource.org) and split into Latin, Latin Extended,
Cyrillic and Cyrillic Extended subsets. `fonts.css` declares each subset with a
`unicode-range`, so a page only downloads what its text uses. Manrope has no
italic; the browser slants it on the rare title that asks for one.

The token layer never names a family directly — `typography.css` goes through
`--font-family-*` — so replacing a face is a one-line change.
