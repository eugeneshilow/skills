// POST /api/pay -> { url } : a fresh Prodamus payment link for one order.
import { NextResponse } from 'next/server'
import { createPaymentLink } from '../../../lib/prodamus'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const origin = new URL(request.url).origin
  // Create the order row in your database first; its id is the only reliable thread
  // from "this payment" back to "this order" (the webhook returns it as order_num).
  const orderId = `order-${crypto.randomUUID()}`
  try {
    const url = await createPaymentLink({
      orderId,
      productName: 'Access to the course',
      price: 100,
      urlSuccess: `${origin}/pay/thanks?order=${orderId}`, // a redirect is NOT a payment
      urlReturn: `${origin}/pay`,
      urlNotification: `${origin}/api/prodamus/webhook`,
      demo: process.env.PRODAMUS_DEMO === '1',
    })
    return NextResponse.json({ orderId, url })
  } catch (error) {
    console.error('[pay] link failed', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'payment_unavailable' }, { status: 502 })
  }
}
