# AGENTS.md

Public repository of Agent Skills. English only; Russian appears only as data inside a skill that works on Russian text.

- One folder per skill under `skills/`, folder name = `name` in the front matter, kebab-case.
- `SKILL.md` stays under 500 lines; details go to `references/`, helpers to `scripts/`.
- Before every commit run `node scripts/validate-skills.mjs`; CI runs the same check on every pull request.
- Changes land through a pull request. No secrets, keys, personal data or infrastructure details of the author ever enter this repository.
