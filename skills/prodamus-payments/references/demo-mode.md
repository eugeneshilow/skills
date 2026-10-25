# Demo mode: a full test payment without money

## Turning it on

- **One link** (what an integration uses): add `demo_mode=1` to the signed link request. It works on a live form and needs no call to Prodamus support. The payment page then says «Оплата работает в демо-режиме».
- **The whole form**: cabinet → «Настройки» → «Настройка формы» → «Деморежим без приёма оплаты» → «Сохранить». Every link is a test link until you switch back to «Режим приёма оплаты». Do not do this on a form that takes real payments.
- A new form starts in demo mode and goes live only after the contract is signed.

## Test cards

Pay with the method «Visa/MasterCard/МИР, RUB». Cards from the official page (checked 2026-10-25):

| card | number | expiry | CVC | 3-D Secure |
| --- | --- | --- | --- | --- |
| МИР (Сбербанк) | 2202 2050 0001 2424 | 05/35 | 669 | none |
| Mastercard (Сбербанк) | 5469 9801 0004 8525 | 12/31 | 041 | 111111 |
| Visa (Сбербанк) | 4006 8009 0096 2514 | 05/30 | 706 | 111111 |

The form also asks for a phone and an email. Use a test address on a reserved domain (`…@example.com`) unless you want to see the buyer's email.

`demoFlow=reject` on the link plays the "installment declined" path, in demo mode only.

## The demo signing key

Field reports say demo webhooks are signed not with the form's secret key but with the same key plus the suffix `demo` (`<secret>demo`). The official pages do not mention it, and it was not confirmed on 2026-10-25 (see "When the demo acquirer is down" below). Treat it as a hypothesis and code for both:

- on a route that only serves demo orders, accept either key and store which one matched (`signedWith: live | demo`); after the first real demo payment, keep only the key that actually signs;
- on the production route, never accept the demo key. A demo payment must not grant real access.

## What a demo payment does

- The webhook fires like a real one: same fields, `payment_status=success`.
- It goes to every notification address of the form, not only to the link's `urlNotification`. If the cabinet points at your production webhook, the production webhook receives demo payments too. Make sure it either rejects them (signature or order prefix) or records them as test rows.
- No money moves. The card is not saved, so recurring charges cannot be tested this way.
- The acquirer's order id carries a `_demo` suffix (visible in the acquirer page URL).

## Practical notes from a live run (2026-10-25)

- **Prefill `customer_phone` and `customer_email`** on the demo link (test values such as `+79990000000` and `paytest@example.com`). The page then skips the contact step and opens the payment methods at once. Without a prefill, the phone field picks its country by the visitor's IP: behind a VPN it shows a foreign code.
- **«Visa/MasterCard/МИР, RUB» leads to the acquirer's own demo page** (Gazprombank, `payacq.ru`). The card form is there, not on payform.ru.
- **The symbol `₽` in a product name turns into «руб»** on the payment page. Write «руб» yourself.
- **Prodamus asks to turn off VPN before paying.** Open the link from a phone on mobile data if the desktop runs through a VPN.

## When the demo acquirer is down

On 2026-10-25 the demo link opened fine and the page said «Оплата работает в демо-режиме». But the card method ended on the acquirer page with «Ошибка проведения платежа · Не удалось получить ответ от сервера». СБП answered «По техническим причинам не удается перейти на оплату». This happened from a Russian IP too. The fault was on the provider's side, not in the integration.

Do not wait for it. Test the webhook half on its own: build a payload with the real field names (see [webhook.md](webhook.md)), sign it with your key, POST it to your webhook three times — once, again (still one row), and with a broken `Sign` (403). That proves everything on your side. The demo payment proves only that Prodamus calls you; repeat it when the acquirer is back.

## End-to-end test script

1. `PRODAMUS_DEMO=1`; create a link through your own route; get `https://payform.ru/…`.
2. Open it: «Оплата работает в демо-режиме» must be on the page. If it is not, stop: a real card would be charged.
3. Pay with the МИР test card.
4. The webhook answered 200; one payment row exists, marked as a test.
5. Resend the same notification (cabinet → «Список платежей» → payment → 🗘, or replay the saved body with the same `Sign`): still one row.
6. Send the body with a broken `Sign`: 403, no row.
7. Remove the test rows, or keep them under a test marker your reports exclude.
