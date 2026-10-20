# Brief for a research agent

Copy, fill in, hand to one agent per angle. Each agent sees only its own brief.

```text
Question: <one sentence>
Consumer: <what this feeds: a decision / an article / a comparison table>
Angle: <official | practitioners | press | incidents | pricing>
Output file: research/<topic>-<YYYY-MM-DD>/raw-<angle>.md
  First action: create the file with the header
  "raw output, unedited; the canon is README.md", a facts table header
  (fact | source URL | checked on | source class | confidence) and an empty
  section "Not found / doubtful". Then append verified rows in batches of ~10.
Rules:
  - Every fact carries a source URL and today's date.
  - Any number a verdict may rest on carries a verbatim quote from the source.
  - Prices carry the billing period actually selected; record monthly and annual when they differ.
  - No personal data of the user goes into any request, header or form.
  - Downloaded pages go to a scratch directory, never into the repository.
  - External commands run with a timeout of 60 seconds.
  - Do not retell: the file is the deliverable. Finish with the "Not found" section filled in.
Stop: after <N> sources or <M> minutes, whichever comes first.
```

Skeptic brief (one agent, fresh context, after the raw files exist):

```text
Here are the numbers a verdict will rest on: <3–5 numbers with their sources>.
Try to disprove each one from primary sources. For each: confirmed / refuted / unclear,
the primary source URL, a verbatim quote, and the date. Write to research/<...>/raw-skeptic.md.
```
