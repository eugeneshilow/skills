#!/usr/bin/env node
// Validates every skills/*/SKILL.md and the marketplace manifest.
// Checks: front matter present and well-formed, name matches the folder and the
// Agent Skills naming rule, description length, body under 500 lines, relative
// links resolve, marketplace paths exist. Exits 1 on the first problem list.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';

const root = resolve(dirname(new URL(import.meta.url).pathname), '..');
const problems = [];
const skillsDir = join(root, 'skills');

function frontMatter(text) {
  if (!text.startsWith('---\n')) return null;
  const end = text.indexOf('\n---', 4);
  if (end < 0) return null;
  const block = text.slice(4, end);
  const fields = {};
  let current = null;
  for (const line of block.split('\n')) {
    const top = line.match(/^([a-zA-Z-]+):\s*(.*)$/);
    if (top) { current = top[1]; fields[current] = top[2].trim(); continue; }
    const nested = line.match(/^\s+([a-zA-Z-]+):\s*(.*)$/);
    if (nested && current) { fields[`${current}.${nested[1]}`] = nested[2].trim(); }
  }
  return { fields, body: text.slice(end + 4) };
}

for (const name of readdirSync(skillsDir)) {
  const dir = join(skillsDir, name);
  if (!statSync(dir).isDirectory()) continue;
  const file = join(dir, 'SKILL.md');
  if (!existsSync(file)) { problems.push(`${name}: SKILL.md missing`); continue; }
  const text = readFileSync(file, 'utf8');
  const fm = frontMatter(text);
  if (!fm) { problems.push(`${name}: front matter must start on line 1 with ---`); continue; }
  const { fields, body } = fm;
  if (fields.name !== name) problems.push(`${name}: front matter name "${fields.name}" != folder name`);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(fields.name || '') || (fields.name || '').length > 64) problems.push(`${name}: name must be kebab-case, max 64 chars`);
  const d = fields.description || '';
  if (d.length < 1 || d.length > 1024) problems.push(`${name}: description must be 1–1024 chars (is ${d.length})`);
  if ((fields.compatibility || '').length > 500) problems.push(`${name}: compatibility over 500 chars`);
  const lines = body.split('\n').length;
  if (lines > 500) problems.push(`${name}: body has ${lines} lines, max 500`);
  for (const m of body.matchAll(/\]\(([^)#]+)(?:#[^)]*)?\)/g)) {
    const target = m[1];
    if (/^[a-z]+:/.test(target)) continue;
    if (!existsSync(join(dir, target))) problems.push(`${name}: link target missing: ${target}`);
  }
}

const mp = JSON.parse(readFileSync(join(root, '.claude-plugin', 'marketplace.json'), 'utf8'));
for (const plugin of mp.plugins || []) {
  for (const p of plugin.skills || []) {
    if (!existsSync(join(root, p, 'SKILL.md'))) problems.push(`marketplace: ${p} has no SKILL.md`);
  }
}

if (problems.length) {
  console.error(problems.map((p) => `✗ ${p}`).join('\n'));
  process.exit(1);
}
console.log('✓ skills valid');
