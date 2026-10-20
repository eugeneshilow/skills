---
name: deslop-ru
description: Removes the traces of machine writing from a Russian text in two passes without changing its facts. Pass one runs the deterministic humanizer-ru word scanner (filler phrases, bureaucratic verbs, intensifiers, dashes, noun-to-verb ratio). Pass two is a fresh-context rhetoric check against a ten-point list the scanner cannot see ("не X, а Y", closing morals, rule-of-three, even density). Edits are applied as a "was → now" table and the scanner confirms the meaning did not drift. Use on any public Russian text (article, post, landing copy, newsletter, lesson) when the user says "де-слоп", "убери нейрослоп", "звучит как ИИ", "почисти текст", or before publishing.
license: MIT
compatibility: Designed for Claude Code; works in any Agent Skills client. Needs python3 for the scanner; the rhetoric pass needs a fresh agent context (a subagent or a new session).
metadata:
  author: eugeneshilow
  version: "0.1.0"
---

# De-slop a Russian text

A text can pass every word-level detector and still read as machine-written: the symmetry "не просто X, а Y", the moral at the end of every paragraph, the perfectly even rhythm. Those live in the rhetoric, and a word scanner cannot see them. So the text gets two readers instead of the author re-reading it five times: a scanner that counts words, and a fresh-context editor that reads the rhetoric. The author sees only the list of edits, or nothing at all.

## When to use

- Any Russian text that will be published: article, post, landing page copy, newsletter, lesson, product card.
- Not for facts: numbers, names, dates, links, code and terms are never touched here. Fact-checking is a separate pass.

## Steps

1. **Plain text in.** Save the text as `.txt`: headings without `#`, no tables, image captions as paragraphs. Keep the original as `before.txt`.
2. **Pass one — scanner.** Run `scripts/scan.sh before.txt` (it clones [humanizer-ru](https://github.com/ilyautov/humanizer-ru) into a scratch directory on first use and installs its three Python packages into a local venv). Read the score 0–100 and the flagged positions. 85 and above is clean on the word layer; 60–84 means targeted edits; below 60 means a rewrite. Genre for articles and posts: `news`.
3. **Pass two — rhetoric editor.** Hand the text to an agent with a **fresh context** (a subagent, or a new session) together with the prompt in [references/editor-prompt.md](references/editor-prompt.md). It returns a slop score N/10, a table of up to 25 edits (number | checklist item | was, verbatim | now), and the author's three most frequent patterns. It never rewrites the whole text.
4. **Apply.** Apply the edits from the table to the text. Skip and list separately any edit that would change the meaning (a fact, a claim, a number); those go to the author as questions, not as edits. Keep one dash and one colon per paragraph at most; end paragraphs on a fact, not a summary; remove intensifiers rather than replacing them with synonyms; where a vague phrase has no concrete fact to replace it, mark `[нужен факт]` and do not invent one.
5. **Fact lock.** Run `scripts/scan.sh after.txt --before before.txt`. The `--before` check confirms the meaning did not drift and reports the new score.
6. **Second round** if the editor's score was 5/10 or higher: repeat step 3 on the edited text once.
7. **Report** in one line: "де-слоп: сканер N/100 → M/100, редактор K/10, внесено X правок, Y спорных — списком ниже". Then the list of disputed edits, if any.

## Done when

- Scanner score after edits is 85 or higher, or the remaining flags are explained.
- Editor score after the last round is below 5/10.
- Every number, name, date, link and term in the text is unchanged (the `--before` check passed).
- Disputed edits are listed for the author, not applied.

## References

- [references/editor-prompt.md](references/editor-prompt.md) — the exact prompt for the rhetoric pass, in Russian, with the ten-point checklist and the editing rules.
- [references/markers.md](references/markers.md) — the 36 markers of machine-written Russian with their sources; the evidence behind the checklist.
- [scripts/scan.sh](scripts/scan.sh) — wrapper that installs and runs the humanizer-ru scanner.
