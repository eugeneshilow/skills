# Prodamus payment webhook

Prodamus POSTs a payment notification to every notification address: the ones in cabinet → «Настройки» → «Настройка уведомлений», and the link's own `urlNotification`. The signature arrives in the `Sign` header. The docs say the body is `multipart/form-data`; in practice `application/x-www-form-urlencoded` arrives as well, so accept both. With `callbackType=json` on the link it is JSON.

## Fields of a one-off payment

Seen on real payments (field names only, values here are invented):

| field | meaning |
| --- | --- |
| `order_num` | **your** `order_id` from the link. Use it to find your order |
| `order_id` | **Prodamus'** id of this payment. Use it as the idempotency key |
| `date` | payment time |
| `domain` | the form, `<shop>.payform.ru` |
| `sum`, `currency` | amount actually paid, currency (`rub`) |
| `customer_email`, `customer_phone`, `customer_extra` | what the buyer typed on the form |
| `products[i][name]`, `[price]`, `[quantity]`, `[sum]` | the items |
| `payment_type`, `payment_init` | method (card, SBP, installments…), who started it (`manual` for a buyer on the page) |
| `commission`, `commission_sum` | Prodamus fee |
| `attempt` | delivery attempt number |
| `payment_status` | `success` pays the order; other values (`order_canceled`, `order_denied`, …) do not |
| `payment_status_description` | human text for the status |

Formats seen: `sum` is a decimal string (`"100.00"`), `currency` is lowercase (`rub`). Parse `sum` as a decimal; do not compare strings.

Subscription payments carry an extra `subscription[…]` block (`id`, `profile_id`, `action_code`, `last_attempt`…): see the subscription skill linked from SKILL.md.

`order_id` and `order_num` are easy to swap. The rule: `order_num` says which of your orders this is; `order_id` says which Prodamus payment this is.

## Answers and retries

- 200: processed; Prodamus stops sending.
- Anything else: Prodamus retries on a growing interval («Интервалы уведомлений» in the docs).
- So: 403 on a bad signature, 500 on your own failure (database down), 200 for "already have it" and for statuses you ignore.
- You can resend a notification by hand: cabinet → «Список платежей» → payment id → 🗘 in the «URL-оповещения» block. Settings → «Настройка уведомлений» → 🔁 sends a test notification.

## A valid signature on an order you cannot match

One cabinet sends every payment to every notification address it knows. A correctly signed payment for an order you do not recognise is still a real payment. Do not drop it: store it as "unmatched" with the raw fields (minus what you must not keep), answer 200, and alert a person. Answering 4xx or 5xx only makes Prodamus resend it for hours. The exception is a narrow route that only ever receives its own links' notifications, such as a demo route: there a 400 on a foreign order is a useful alarm.

## Idempotency

Retries and parallel deliveries are normal. Use a UNIQUE index on `(provider, payment id)` and insert first. If the insert hits the constraint, this is a repeat: answer 200 and stop. A check like "was there such an event in the last minute" fails on late retries and on two deliveries at once.

## What a matching signature does not prove

- That the amount is right. Compare `sum` with the order.
- That this is the product you sell here. One cabinet often sells several things; compare the product name or your own order id.
- That this is a live payment. Demo payments also post to the webhook (see [demo-mode.md](demo-mode.md)). Keep demo orders apart, for example by an order-id prefix, and never let them grant real access.
