---
name: second-opinion
description: Independent review of a decision or a change by another model, only where the risk is. Writes a brief the reviewer can read without the chat, runs the reviewer read-only (a subagent of a different model, claude -p in plan mode, or codex exec read-only), and returns a verdict with severities, not an auto-patch. Use before locking in architecture, URLs, a data schema, payments, auth, deploy, a public page people will screenshot, or a method of calculation; when the user says "second opinion", "второе мнение", "пусть проверит другая модель", "дай на ревью".
license: MIT
compatibility: Designed for Claude Code; works in any Agent Skills client. The read-only launch commands assume the claude and/or codex CLI is installed.
metadata:
  author: eugeneshilow
  version: "0.1.0"
---

# Second opinion

A second doctor does not treat instead of the first; he catches the blind spots. A second opinion is an independent read of a decision by a model that did not write it, from a brief, with no power to edit. It is not a pull request review (self-review and CI happen on every change anyway) and not a way to make two agents argue about commas. It is for the places where a mistake is expensive.

## When to use

1. Before locking in architecture, URL structure, a data schema, payments, auth, deploy, or any other contour where a mistake costs money or access.
2. A public page that people will screenshot and forward.
3. A method of calculation: a benchmark, a rating, a price list.
4. A long agent loop where one model may already have fallen in love with its own solution.

Not for taste, naming or lint-level remarks. Small, scoped changes in UI, copy or docs skip it; write "second opinion skipped: low-risk scoped change" in the report instead.

## Steps

1. **Name the risk zone** in one line: what exactly is being locked in and what breaks if it is wrong. If nothing on the list above applies, stop and say so.
2. **Write the brief** to a scratch file (`/tmp/<task>-brief.md`): the reviewer has not seen the chat. Template: [references/brief.md](references/brief.md). The brief contains context, the branch or pull request, links to previews, the exact numbers, what must not change, and the definition of done. It never contains secrets, tokens, cookies, card numbers or private keys.
3. **Write the reviewer instruction**, two or three sentences: role, task, language, "no flattery". For example: "You are a strict senior data architect. Find the holes. Answer in Russian, no flattery, severity on every finding."
4. **Pick the channel.** Read-only only; the reviewer must not edit files.
   - A subagent of a *different* model than the author, when the client has one.
   - `cat brief.md | claude -p "<instruction>" --model <model> --permission-mode plan` from the repository root, so the reviewer can read the real files.
   - `cat brief.md | codex exec -m <model> -s read-only -c approval_policy="never" "<instruction>"`.
   Pass the brief by file path when you can; a brief inlined into a command shows up in the process list.
5. **Read the verdict as input, not as a sentence.** Where you agree, take it. Where you do not, write the counter-argument next to the finding. Technical findings go to the author's own fix loop; findings about meaning or architecture go to the human.
6. **Record** the verdict and what was taken from it where the decision is recorded (the project's journal or the pull request), so the next reader sees that a second opinion happened and what it changed.

## Done when

- The risk zone is named, or the skip line is in the report.
- The brief exists and is self-contained (no chat needed to review).
- The reviewer ran read-only and the verdict carries severities.
- Every finding has a decision: taken, or declined with a reason.
- The decision record points to the verdict.

## References

- [references/brief.md](references/brief.md) — the brief template and the reviewer instruction.
