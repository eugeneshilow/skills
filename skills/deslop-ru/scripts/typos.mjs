#!/usr/bin/env node
// Adds human typing texture to a short Russian text: swapped/dropped letters in long
// words, «ё»→«е», a few dropped commas, hyphen for dash. Skips numbers, Latin, quotes,
// links. Patterns and limits: references/typos-ru.md.
import fs from 'node:fs'

const args = process.argv.slice(2)
const file = args.find((a) => !a.startsWith('--'))
if (!file) { console.error('usage: typos.mjs <file.txt> [--rate N] [--seed N]'); process.exit(2) }
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? Number(args[i + 1]) : d }
const RATE = opt('--rate', 3)
let seed = opt('--seed', Date.now() % 100000)
const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648 }

let text = fs.readFileSync(file, 'utf8')
const log = []

// 1. «ё» → «е» everywhere (outside quotes too — people type it everywhere)
text = text.replace(/ё/g, 'е').replace(/Ё/g, 'Е')

// 2. dashes → hyphen, outside quotes
const protectedSpans = []
text.replace(/«[^»]*»|"[^"]*"|https?:\/\/\S+|`[^`]*`/g, (m, off) => { protectedSpans.push([off, off + m.length]); return m })
const isProtected = (i) => protectedSpans.some(([a, b]) => i >= a && i < b)
text = text.replace(/ — /g, (m, off) => (isProtected(off) ? m : ' - '))

// 3. drop some commas before conjunctions
text = text.replace(/,( (?:что|если|где|как|чтобы|когда|потому) )/g, (m, g, off) => {
  if (isProtected(off) || rnd() > 0.45) return m
  log.push(`запятая снята перед «${g.trim()}»`)
  return g
})

// 4. letter errors in long Cyrillic words
const words = text.split(/(\s+)/)
const wordCount = words.filter((w) => /[а-яА-Я]{2,}/.test(w)).length
const target = Math.max(1, Math.round((wordCount / 100) * RATE)) - log.length
let pos = 0
const candidates = []
for (let i = 0; i < words.length; i++) {
  const w = words[i]
  if (/^[а-яА-Я]{6,}[.,:;!?]*$/.test(w) && !isProtected(pos) && !/^[А-Я]/.test(w)) candidates.push(i)
  pos += w.length
}
let usedSentence = new Set()
let applied = 0
const shuffled = candidates.sort(() => rnd() - 0.5)
for (const i of shuffled) {
  if (applied >= target) break
  const sentenceIdx = words.slice(0, i).join('').split(/[.!?]/).length
  if (usedSentence.has(sentenceIdx)) continue
  const m = words[i].match(/^([а-яА-Я]+)([.,:;!?]*)$/)
  const w = m[1], tail = m[2]
  const k = 1 + Math.floor(rnd() * (w.length - 3)) // index of error, never first/last letter
  let nw
  const r = rnd()
  if (r < 0.6) nw = w.slice(0, k) + w[k + 1] + w[k] + w.slice(k + 2) // swap
  else if (r < 0.9) nw = w.slice(0, k) + w.slice(k + 1) // drop
  else nw = w.slice(0, k) + w[k] + w.slice(k) // double
  if (nw === w) continue
  words[i] = nw + tail
  log.push(`${w} → ${nw}`)
  usedSentence.add(sentenceIdx)
  applied++
}
process.stdout.write(words.join(''))
console.error(`typos: ${log.length} правок на ${wordCount} слов (seed ${seed})\n- ` + log.join('\n- '))
