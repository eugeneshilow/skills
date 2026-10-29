# skills

Agent Skills by [Eugene Shilov](https://github.com/eugeneshilow): crafts a coding agent can pick up on demand. Each skill is a folder with a `SKILL.md` that follows the [Agent Skills](https://agentskills.io) format, so it works in Claude Code, Codex, Cursor and any other client that reads skills.

These skills grew inside a working company run on [Spec-Driven Company](https://github.com/eugeneshilow/spec-driven-company): the method gives the rules every agent reads first; the skills here are the crafts on top of them. Each one is used daily before it is published.

## Skills

| Skill | What it does | Say |
| --- | --- | --- |
| [research-pass](skills/research-pass/) | Research that does not get lost: a dated folder per pass, a synthesis plus the raw agent output, a source URL and date on every fact, a mandatory "Not found" section, and a second agent that tries to disprove the key numbers. | "Research X and keep it as a pass" |
| [deslop-ru](skills/deslop-ru/) | Removes the traces of machine writing from a Russian text in two passes: a deterministic word scanner, then a fresh-context rhetoric check against a ten-point list. Edits are applied as a "was → now" table. | "Де-слоп этот текст" |
| [second-opinion](skills/second-opinion/) | An independent review by another model, only where the risk is: money, auth, data schema, deploy, public methodology. Comes with a brief template and read-only launch commands. | "Get a second opinion on this" |
| [prodamus-payments](skills/prodamus-payments/) | Takes card payments through Prodamus (payform.ru): a signed payment link, a webhook that checks the `Sign` header and records each payment once, a demo-mode test. Signature code in TypeScript and Python, checked against vectors from the official `Hmac.php`. | "Подключи оплату через Продамус" |

## Install

One skill or all of them, into Claude Code:

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
```

Language policy: this repository is in English. A skill that works on Russian text keeps its Russian examples and word lists as data; the instructions stay in English.

## Make them yours

These skills are starting points. Edit them. Keep what is personal to you, such as which model gives the second opinion or where research passes live in your repository, in your `CLAUDE.md` or `AGENTS.md`, so you can update the skills without losing it. The agent reads the project's rules before any skill, so they win.

## License

MIT, see [LICENSE](LICENSE). `deslop-ru` runs the [humanizer-ru](https://github.com/ilyautov/humanizer-ru) scanner by Ilya Utov under its own license.
