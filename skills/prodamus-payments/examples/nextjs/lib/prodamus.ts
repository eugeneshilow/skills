// Prodamus for a Next.js app (App Router). Server-only: never import from a client component.
// Signature = port of the official Hmac.php (help.prodamus.ru), Web Crypto, so it runs on
// both the Node and the Edge runtime. Checked against ../../scripts/vectors.json.

export type ProdamusData = Record<string, unknown>

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const key of Object.keys(value as object).sort()) {
      out[key] = canonicalize((value as Record<string, unknown>)[key])
    }
    return out
  }
  if (value === null || value === undefined || value === false) return ''
  if (value === true) return '1'
  return String(value)
}

async function hmacSha256Hex(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))
  return Array.from(new Uint8Array(mac), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function prodamusSign(data: ProdamusData, secret: string): Promise<string> {
  const json = JSON.stringify(canonicalize(data)).replace(/\//g, '\\/')
  return hmacSha256Hex(json, secret)
}

export async function prodamusVerify(
  data: ProdamusData,
  secret: string,
  header: string | null
): Promise<boolean> {
  const given = (header ?? '').trim().toLowerCase()
  if (!/^[0-9a-f]{64}$/.test(given)) return false
  const { signature: _ignored, ...rest } = data
  const expected = await prodamusSign(rest, secret)
  let diff = 0
  for (let i = 0; i < expected.length; i += 1) diff |= expected.charCodeAt(i) ^ given.charCodeAt(i)
  return diff === 0
}

/** Flatten nested data into PHP bracket notation: products[0][name]=... */
function appendBracketed(form: URLSearchParams, value: unknown, name: string): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => appendBracketed(form, item, `${name}[${index}]`))
  } else if (value !== null && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) appendBracketed(form, item, `${name}[${key}]`)
  } else {
    form.append(name, value === null || value === undefined ? '' : String(value))
  }
}

export function toForm(data: ProdamusData): URLSearchParams {
  const form = new URLSearchParams()
  for (const [key, value] of Object.entries(data)) appendBracketed(form, value, key)
  return form
}

/**
 * Rebuild the nested object from a webhook body. Prodamus posts form fields in PHP
 * notation (products[0][name]); the signature is computed over the nested structure,
 * exactly as PHP sees $_POST. Objects whose keys are 0..n-1 become arrays (PHP lists).
 */
export function fromForm(entries: Iterable<[string, string]>): ProdamusData {
  const root: Record<string, unknown> = {}
  for (const [rawKey, value] of entries) {
    const parts = rawKey.replace(/\]/g, '').split('[')
    let node = root
    parts.forEach((part, index) => {
      if (index === parts.length - 1) {
        node[part] = value
      } else {
        node[part] = (node[part] as Record<string, unknown>) ?? {}
        node = node[part] as Record<string, unknown>
      }
    })
  }
  const listify = (value: unknown): unknown => {
    if (value === null || typeof value !== 'object') return value
    const object = value as Record<string, unknown>
    const keys = Object.keys(object)
    const isList = keys.length > 0 && keys.every((key, index) => key === String(index))
    return isList ? keys.map((key) => listify(object[key])) : Object.fromEntries(keys.map((key) => [key, listify(object[key])]))
  }
  return listify(root) as ProdamusData
}

export type PaymentLinkInput = {
  orderId: string // your own order id; comes back in the webhook as order_num
  productName: string
  price: number // rubles
  customerEmail?: string
  customerPhone?: string
  urlSuccess: string
  urlReturn: string
  urlNotification?: string // per-link webhook address
  demo?: boolean // demo_mode=1: test cards only, no money moves
}

/**
 * Ask the payment form for a short link (do=link). Returns https://payform.ru/xxxx/ that is
 * safe to show: it carries no personal data, unlike a long do=pay URL.
 */
export async function createPaymentLink(input: PaymentLinkInput): Promise<string> {
  const formUrl = process.env.PRODAMUS_FORM_URL // https://<your-shop>.payform.ru/
  const secret = process.env.PRODAMUS_SECRET_KEY
  if (!formUrl || !secret) throw new Error('PRODAMUS_FORM_URL and PRODAMUS_SECRET_KEY must be set')

  const data: ProdamusData = {
    do: 'link',
    order_id: input.orderId,
    products: [{ name: input.productName, price: String(input.price), quantity: '1' }],
    urlSuccess: input.urlSuccess,
    urlReturn: input.urlReturn,
  }
  if (input.customerEmail) data.customer_email = input.customerEmail
  if (input.customerPhone) data.customer_phone = input.customerPhone
  if (input.urlNotification) data.urlNotification = input.urlNotification
  if (process.env.PRODAMUS_SYS) data.sys = process.env.PRODAMUS_SYS
  if (input.demo) data.demo_mode = '1'
  data.signature = await prodamusSign(data, secret)

  const response = await fetch(formUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: toForm(data).toString(),
    cache: 'no-store',
  })
  const body = (await response.text()).trim()
  const url = URL.canParse(body) ? new URL(body) : null
  const fromPayform =
    url?.protocol === 'https:' && (url.hostname === 'payform.ru' || url.hostname.endsWith('.payform.ru'))
  if (!response.ok || !fromPayform) {
    throw new Error(`Prodamus did not return a link (HTTP ${response.status})`)
  }
  return body
}
