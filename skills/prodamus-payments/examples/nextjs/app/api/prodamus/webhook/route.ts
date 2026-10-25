// POST /api/prodamus/webhook : the only place where an order becomes "paid".
import { fromForm, prodamusVerify, type ProdamusData } from '../../../../lib/prodamus'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Replace with your database. The idempotency lock must be a UNIQUE constraint on the key
// (Prodamus retries for hours); an in-memory Set is only good for a local try-out.
const seen = new Set<string>()
async function recordPaymentOnce(key: string, row: Record<string, unknown>): Promise<boolean> {
  if (seen.has(key)) return false
  seen.add(key)
  console.log('[prodamus] recorded', key, row)
  return true
}

export async function POST(request: Request) {
  const secret = process.env.PRODAMUS_SECRET_KEY
  if (!secret) return new Response('not configured', { status: 500 })

  const type = request.headers.get('content-type') ?? ''
  let data: ProdamusData
  if (type.includes('application/json')) {
    data = (await request.json()) as ProdamusData // links created with callbackType=json
  } else {
    const form = await request.formData() // multipart/form-data or x-www-form-urlencoded
    data = fromForm(Array.from(form.entries(), ([key, value]) => [key, String(value)] as [string, string]))
  }

  const sign = request.headers.get('sign')
  const live = await prodamusVerify(data, secret, sign)
  // Demo payments may be signed with "<secret>demo"; accept that key ONLY for demo orders.
  const demo = !live && process.env.PRODAMUS_DEMO === '1' && (await prodamusVerify(data, `${secret}demo`, sign))
  if (!live && !demo) return new Response('invalid signature', { status: 403 })

  const status = String(data.payment_status ?? '')
  if (status !== 'success') return new Response('OK', { status: 200 }) // canceled, denied...

  const orderNum = String(data.order_num ?? '') // = your order_id from the link
  const prodamusOrderId = String(data.order_id ?? '') // Prodamus' own payment id
  const isNew = await recordPaymentOnce(`prodamus:${prodamusOrderId || orderNum}`, {
    orderNum,
    sum: String(data.sum ?? ''),
    demo,
  })
  if (isNew) {
    // Grant access / send the receipt email here, with await (serverless kills
    // unawaited work after the response). Check the amount against the order first.
  }
  return new Response('OK', { status: 200 })
}
