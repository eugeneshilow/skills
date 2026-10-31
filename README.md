*English ∙ [Русский](lang/ru/README.md)*

# skills

Agent Skills by [Evgeny Shilov](https://github.com/eugeneshilow): crafts a coding agent can pick up on demand. Each skill is a folder with a `SKILL.md` that follows the [Agent Skills](https://agentskills.io) format, so it works in Claude Code, Codex, Cursor and any other client that reads skills.

These skills grew inside a working company run on [Spec-Driven Company](https://github.com/eugeneshilow/spec-driven-company): the method gives the rules every agent reads first; the skills here are the crafts on top of them. Each one is used daily before it is published.

## Skills

| Skill | What it does | Say |
| --- | --- | --- |
| [research-pass](skills/research-pass/) | Research that does not get lost: a dated folder per pass, a synthesis plus the raw agent output, a source URL and date on every fact, a mandatory "Not found" section, and a second agent that tries to disprove the key numbers. | "Research X and keep it as a pass" |
| [deslop-ru](skills/deslop-ru/) | Removes the traces of machine writing from a Russian text in two passes: a deterministic word scanner, then a fresh-context rhetoric check against a ten-point list. Edits are applied as a "was → now" table. | "Де-слоп этот текст" |
| [second-opinion](skills/second-opinion/) | An independent review by another model, only where the risk is: money, auth, data schema, deploy, public methodology. Comes with a brief template and read-only launch commands. | "Get a second opinion on this" |
| [prodamus-payments](skills/prodamus-payments/) | Takes card payments through Prodamus (payform.ru): a signed payment link, a webhook that checks the `Sign` header and records each payment once, a demo-mode test. Signature code in TypeScript and Python, checked against vectors from the official `Hmac.php`. | "Подключи оплату через Продамус" |

## Install: paste into your agent

Open your coding agent (Claude Code, Codex, Cursor, any other) and paste a prompt. Not into the terminal, into the agent. It ends with a report: where the skill now lives and the phrase that calls it.

**One skill.** The example installs `research-pass`; for another skill, put its name from the table in both places.

```text
Install this skill for me: https://github.com/eugeneshilow/skills/tree/main/skills/research-pass. Clone https://github.com/eugeneshilow/skills with git clone --depth 1 into a temporary folder and copy its folder skills/research-pass to ~/.claude/skills/research-pass/, so it works in every project; if you are Codex, copy it to ~/.codex/skills/research-pass/ instead. If that folder already exists, replace it: this is how the skill is updated. Do not edit the files. Delete the temporary folder. Done when ~/.claude/skills/research-pass/SKILL.md exists (or the Codex path) and its name line says research-pass. Report: the path, and the phrase that calls the skill.
```

**All skills.**

```text
Install all skills from https://github.com/eugeneshilow/skills for me. Clone it with git clone --depth 1 into a temporary folder and copy every folder from its skills/ into ~/.claude/skills/, so they work in every project; if you are Codex, copy them into ~/.codex/skills/ instead. If a folder with the same name already exists, replace it: this is how the skills are updated. Do not edit the files. Delete the temporary folder. Done when every copied folder holds a SKILL.md. Report: the list of installed skills, and the phrase that calls each one.
```

If a skill does not show up, start a new session in the agent.

## Install: commands

The same, by hand. One skill or all of them, into Claude Code:

```bash
npx skills add eugeneshilow/skills                       # pick from the list
npx skills add eugeneshilow/skills --skill research-pass # one skill
```

As a Claude Code plugin:

```text
/plugin marketplace add eugeneshilow/skills
/plugin install shilov-skills@shilov-skills
```

By hand: copy a folder from `skills/` into `~/.claude/skills/` (every project) or `.claude/skills/` (one project). Codex reads the same folders from `~/.codex/skills/`; every skill carries an `agents/openai.yaml` for its skill picker.

Two skills call another one when it is installed, and work without it:

- `research-pass` hands its adversarial check of the key numbers to `second-opinion`.
- `prodamus-payments` sends the signing module and the webhook to `second-opinion` before going live.

## Layout

```text
skills/<name>/SKILL.md      the skill: name + description in the front matter, instructions in the body
skills/<name>/references/   details the agent reads only when it needs them
skills/<name>/scripts/      helpers the skill runs
skills/<name>/agents/       openai.yaml: name, one line and a default prompt for the Codex skill picker
template/SKILL.md           starting point for a new skill
scripts/validate-skills.mjs the check CI runs on every change
lang/ru/README.md           this README in Russian, kept in step with it
```

Language policy: this repository is in English; `lang/ru/README.md` is a Russian mirror of this README. A skill that works on Russian text keeps its Russian examples and word lists as data; the instructions stay in English.

## Make them yours

These skills are starting points. Edit them. Keep what is personal to you, such as which model gives the second opinion or where research passes live in your repository, in your `CLAUDE.md` or `AGENTS.md`, so you can update the skills without losing it. The agent reads the project's rules before any skill, so they win.

## License

MIT, see [LICENSE](LICENSE). `deslop-ru` runs the [humanizer-ru](https://github.com/ilyautov/humanizer-ru) scanner by Ilya Utov under its own license.
