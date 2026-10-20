# Brief template

Save to a scratch file. The reviewer sees only this.

```markdown
# Second opinion: <what is being decided>

## Context
<Three to six sentences: the product, the user, what this change is for. No history of the chat.>

## What to review
- Repository / branch / pull request: <path or link>
- Preview: <URL, if any>
- Files that matter: <list>

## The decision as proposed
<The exact design, schema, URL map, price formula or method. Numbers written out.>

## Constraints
- Must not change: <facts, numbers, public URLs, contracts with other systems>
- Out of scope: <what the reviewer should not spend time on>

## Risk zone
<One of: payments · auth · data schema · deploy · public page · calculation method · long agent loop>

## Definition of done for the review
A list of findings, each with: severity (P0 blocks, P1 must fix before release, P2 later),
what exactly is wrong, why it matters, and the smallest fix. End with one line: ship / fix first / rethink.
```

Reviewer instruction (two or three sentences, adapt the role):

```text
You are a strict senior <role>. Read the brief and the real files, find the holes in the decision,
and answer in <language> with a severity on every finding. No flattery, no restating the brief.
```
