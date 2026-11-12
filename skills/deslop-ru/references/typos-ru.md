# Typos: off by default

**No typos unless the user asks.** De-slop does not add them, and no genre turns them on by itself: not an article, not an email, not a comment reply. The script below runs only when the user asks for typos in a specific text, and the user names the level. Everything else in this file describes how to do it once asked.

## Why the option exists

A clean text with zero typos reads as machine-written in a comment thread or a chat reply. Real people who type fast leave a recognisable texture. This file lists the patterns that `scripts/typos.mjs` reproduces, so a reply gets the same kind of errors a person makes, at the same density, and never in the places a person would not make them.

Even on request, never for documentation, code, quoted rules or anything with a proofreading step.

## Where a fast typist makes errors

| pattern | example | how often |
| --- | --- | --- |
| adjacent letters swapped in the middle of a long word | интересная → интерсная, посмотреть → псмотреть, детерминированно → детерменированно | most common |
| one letter dropped in a long word | опубликуется → опубилкуется, внедрить → внедирть | common |
| a letter doubled | цифры → ццифры | rare |
| «ё» typed as «е» everywhere | ещё → еще, её → ее | almost always |
| comma before «что / если / где / как / чтобы» missing | думаю что; проверять там где живет | often |
| hyphen instead of a dash | «слова - слова» | always |
| abbreviations without dots | и тд, тк, тп | often |
| sentence starts lowercase after a question or in a list | «ну и 57 тыс…» | sometimes |
| a word boundary shifted | это выглядит → эт овыглядит | rare |

## Where a person does NOT make errors

- Numbers, dates, prices: `6 570`, `2026`, `78`.
- Names, handles, product names, Latin words: `AGENTS.md`, `Binance`, `SpecScore`, `@astec`, `await`.
- Anything inside «…» or "…" quotes — a quoted rule is pasted, not typed.
- Links and code.
- Words shorter than eight letters («тесты», «агенты», «спеки») — the eye catches those; the slips happen in long, tangled words («детерминированно», «контрибьюшенов», «интересная»), and the longer the word, the likelier the slip. The script weights candidates by length.
- The first and last letter of a word — swaps happen inside.

## Two levels, chosen by the user

| level | where | density | per sentence |
| --- | --- | --- | --- |
| `low` | a light touch for longer text | 1–2 per 100 words | at most 1 |
| `high` | short chat-style replies | 3–5 per 100 words, a few dropped commas | at most 1 |

The user picks the level; if they asked for typos without one, use `low`. Never two errors in one word.

## How to apply

```bash
node scripts/typos.mjs text.txt                    # low: ~1.5 per 100 words
node scripts/typos.mjs reply.txt --level high      # high: ~4 per 100 words
node scripts/typos.mjs reply.txt --rate 5 --seed 7 # custom density, reproducible
```

The script prints the result to stdout and the list of applied changes to stderr, so the author can veto any of them. Numbers, Latin, quotes and links are skipped by the rules above.
