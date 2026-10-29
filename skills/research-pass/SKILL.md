---
name: research-pass
description: Research that does not get lost. Runs a research pass as a dated folder with a synthesis README plus the raw agent output, a source URL and check date on every fact, a mandatory "Not found" section, and an adversarial check of the key numbers by a second agent. Use when the user asks to research, investigate, compare, find sources, collect references, check prices or benchmarks, or says "research pass", "срез", "ресерч".
license: MIT
compatibility: Designed for Claude Code; works in any Agent Skills client. Uses web search and subagents when the client has them.
metadata:
  author: eugeneshilow
  version: "0.1.0"
---

# Research pass

Research that lives only in a chat is lost work: the session ends, the facts and the thirty reference links die with it. A research pass ends with an artifact in the repository, in the same turn, in a shape the next reader can trust: every fact carries its source and date, what was not found is written down, and the numbers a decision rests on have survived an attempt to disprove them.

## When to use

- Any question that needs sources: a market, a tool, prices, benchmarks, competitors, references for a design, facts for an article or a decision.
- Not for a quick one-fact lookup the user needs in chat right now: answer, then offer to keep it as a pass if it will be needed again.

## Laws

1. **No artifact, no research.** The pass ends with files committed in the same turn. Key findings and reference links also go to the user in chat; the files are the permanent home.
2. **Two kinds of output.** Facts go to a dated pass folder. Reference examples (donors, samples of a form) go to a `refs.md` in the zone they serve: one line per reference with the link, the scale of the source (world top, strong niche player, small), and what to take from it.
3. **One pass = one dated folder, contents immutable.** `research/<topic>-<YYYY-MM-DD>/` (or `research/<YYYY-MM-DD>/` inside a folder that is already about one topic). Inside: `README.md` is the synthesis and the canon of the pass; next to it the raw output of every agent, verbatim, as `raw-<angle>.md`, each with a one-line header "raw output, unedited; the canon is README.md". A later addition on the same day goes into the same folder as another file; a later day gets its own folder. Nothing is edited after the fact: history is the neighbouring dated folders.
4. **Every fact carries provenance.** Source URL and the date it was checked. Mark the source class: official (vendor site or docs), press, practitioners (forums, reviews). A number without a source is a rumour and lives only in "Not found / doubtful".
5. **"Not found / doubtful" is mandatory.** What was searched and not found, what did not confirm, what you do not believe. It saves the next pass from the same dead end and shows the limits honestly.
6. **The brief sets the shape; there is no "tidying up" step.** The agent writes its output straight into the pass folder in the final form.

## Steps

1. **Brief.** Write the question in one sentence, the consumer of the result (a decision, a text, a table), the angles (official / practitioners / press / incidents), the file layout from Law 3, and the stop rules below. Template: [references/brief.md](references/brief.md).
2. **Open the files first.** In the first few actions create the pass folder, the README with its heading, the table header and an empty "Not found" section, and the raw file(s). Then append verified rows in batches of about ten. If the run is cut off, what is on disk is already useful.
3. **Collect by angles.** One agent per angle, blind to the others, each writing its own `raw-<angle>.md`. Two angles reading the same source is not waste: it is a cheap cross-check. Downloaded pages stay in a scratch directory, never in the repository. External commands run with a timeout.
4. **Quote-anchor the key numbers.** Any figure a verdict will rest on (price, deadline, benchmark, release date) is recorded with a verbatim fragment of the source, not a paraphrase. Paraphrased fetches invent numbers.
5. **Prices carry their billing period.** Write the price as shown for the period you actually selected ("$9.99/month on the annual plan; $17.99 billed monthly"). Storefronts default to the annual discount; switch to monthly with a real click and record both when they differ.
6. **No personal data leaves the machine.** The user's name, email, phone and account numbers never go into URLs, headers or forms of third-party sites, even when an API asks for an email.
7. **Adversarial check.** Before the synthesis, a separate agent with a fresh context takes the three to five numbers the verdict stands on and tries to disprove each from primary sources. Mandatory when the pass feeds anything public (an article, a product page, a price list); by judgement otherwise. Its output is `raw-skeptic.md`. If the `second-opinion` skill is installed, run the check through it: it already writes the brief and launches the reviewer read-only.
8. **Synthesis.** Write README.md: verdict first, then the facts table (fact | source URL | date | class | confidence), then "Not found / doubtful", then method (search window, tools, date). Template: [references/pass-readme.md](references/pass-readme.md).
9. **Deliver.** Commit the folder. In chat: the verdict in one line, the three to five findings that matter, the reference links as a list, and the path to the pass.

## Done when

- The pass folder exists with README.md and at least one raw file, committed.
- Every row of the facts table has a URL and a date.
- "Not found / doubtful" has at least one line (an empty section means nobody looked).
- The key numbers passed the skeptic, or the README says which ones did not and why they are kept.
- The user got the verdict and the links in chat.

## References

- [references/brief.md](references/brief.md) — the brief template for a research agent.
- [references/pass-readme.md](references/pass-readme.md) — the README template of a pass.
