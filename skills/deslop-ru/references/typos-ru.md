# Human texture: typo patterns of a fast Russian typist

A clean text with zero typos reads as machine-written in a comment thread or a chat reply. Real people who type fast leave a recognisable texture. This file lists the patterns that `scripts/typos.mjs` reproduces, so a reply gets the same kind of errors a person makes, at the same density, and never in the places a person would not make them.

Use only for short conversational text: comments, replies, chat messages, forum posts. Never for articles, landing copy, documentation or anything with a proofreading step.

## Where a fast typist makes errors

| pattern | example | how often |
| --- | --- | --- |
| adjacent letters swapped in the middle of a long word | интересная → интерсная, посмотреть → псмотреть, чтобы → тчобы | most common |
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
- Short words (five letters and fewer) — the eye catches those.
- The first and last letter of a word — swaps happen inside.

## Density

Two to four errors per hundred words. One error per sentence at most. Never two errors in one word. A hundred-word reply with eight typos reads as a parody, not as a person.

## How to apply

```bash
node scripts/typos.mjs reply.txt            # 3 per 100 words, random seed
node scripts/typos.mjs reply.txt --rate 4   # denser
node scripts/typos.mjs reply.txt --seed 7   # reproducible
```

The script prints the result to stdout and the list of applied changes to stderr, so the author can veto any of them. Numbers, Latin, quotes and links are skipped by the rules above.
