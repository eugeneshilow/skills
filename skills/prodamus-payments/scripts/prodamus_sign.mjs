#!/usr/bin/env node
// Prodamus signature (HMAC-SHA256 over canonical JSON), zero dependencies, Node 18+.
// Port of the official Hmac.php from help.prodamus.ru:
//   1. every scalar -> string (null/undefined -> "", PHP strval)
//   2. object keys sorted alphabetically, recursively (arrays keep their order)
//   3. JSON without unicode escaping, BUT with "/" escaped as "\/" (PHP json_encode default)
//   4. hex HMAC-SHA256 with the secret key of the payment form
//
// Usage:
//   node prodamus_sign.mjs --check                 verify against vectors.json (exit 1 on mismatch)
//   PRODAMUS_SECRET=... node prodamus_sign.mjs '{"order_id":"1"}'   sign a JSON object
import { createHmac, timingSafeEqual } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (value !== null && typeof value === 'object') {
    const out = {}
    for (const key of Object.keys(value).sort()) out[key] = canonicalize(value[key])
    return out
  }
  if (value === null || value === undefined) return ''
  if (value === true) return '1' // PHP strval(true) === "1"
  if (value === false) return '' // PHP strval(false) === ""
  return String(value)
}

export function canonicalJson(data) {
  return JSON.stringify(canonicalize(data)).replace(/\//g, '\\/')
}

export function sign(data, secret) {
  return createHmac('sha256', secret).update(canonicalJson(data), 'utf8').digest('hex')
}

/** Webhook check: drop a `signature` field if present, compare in constant time. */
export function verify(data, secret, header) {
  const given = String(header ?? '').trim().toLowerCase()
  if (!/^[0-9a-f]{64}$/.test(given)) return false
  const { signature: _ignored, ...rest } = data
  const expected = Buffer.from(sign(rest, secret), 'hex')
  return timingSafeEqual(expected, Buffer.from(given, 'hex'))
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]
if (isMain) {
  const arg = process.argv[2]
  if (arg === '--check') {
    const here = dirname(fileURLToPath(import.meta.url))
    const { vectors } = JSON.parse(readFileSync(join(here, 'vectors.json'), 'utf8'))
    let failed = 0
    for (const v of vectors) {
      const got = sign(v.data, v.secret)
      const ok = got === v.expected && verify({ ...v.data, signature: got }, v.secret, got.toUpperCase())
      if (!ok) failed += 1
      console.log(`${ok ? 'ok  ' : 'FAIL'} ${v.name} ${got}`)
    }
    process.exit(failed ? 1 : 0)
  } else if (arg) {
    const secret = process.env.PRODAMUS_SECRET
    if (!secret) {
      console.error('Set PRODAMUS_SECRET in the environment (never pass it as an argument).')
      process.exit(2)
    }
    console.log(sign(JSON.parse(arg), secret))
  } else {
    console.error('Usage: node prodamus_sign.mjs --check | node prodamus_sign.mjs \'<json>\'')
    process.exit(2)
  }
}
