---
name: prodamus-payments
description: Connects card payments through Prodamus (Продамус, payform.ru) to a site or app. A signed payment link, a webhook that verifies the Sign header and records each payment once, a demo-mode test with test cards, and a "payment went through" checklist. Signature code in TypeScript and Python, checked against vectors from the official Hmac.php. Use when the user says "подключи Продамус", "приём оплаты через Prodamus", "ссылка на оплату payform", "вебхук Продамуса", "подпись Sign не сходится", "connect Prodamus payments", "Prodamus webhook".
license: MIT
compatibility: Designed for Claude Code; works in any Agent Skills client. Examples target Next.js App Router (Node 18+) and FastAPI (Python 3.10+). Needs a Prodamus payment form (<shop>.payform.ru) and its secret key.
metadata:
  author: eugeneshilow
  version: "0.1.0"
---

# Prodamus payments

Prodamus has no SDK, no OpenAPI and no MCP for payments. The payment form itself is the API: you send it a signed request, it answers with a payment link, and after the payment it calls your webhook. This skill takes a project from "no payments" to "a test payment in demo mode landed in our database exactly once". Usually that is one sitting and three files: a link route, a webhook route and a small signing module.

## When to use

- A site, bot or app has to take money through Prodamus (`<shop>.payform.ru`).
- An existing integration fails: "подпись не сходится", the webhook gets 403, payments arrive twice, a payment is lost.
- Not for subscriptions with recurring charges. The link and the webhook are the same, but the money rules are not: status transitions, never cutting a prepaid period, `subscription.id` vs `profile_id`. Read [imnadsa/prodamus-subscription-skill](https://github.com/imnadsa/prodamus-subscription-skill) for those.
- Not for Prodamus.XL (online-school platform): it has its own MCP server.

## Before writing code

Ask for, or find in the project, five things:

1. **Payment form address**: `https://<shop>.payform.ru/`. It is on the first screen of the Prodamus cabinet.
2. **Secret key**: cabinet → bottom menu «Настройки» → «Секретный ключ». One key signs both links and webhooks. A new key comes only from Prodamus support.
3. **Where the backend lives**: Next.js route handlers, FastAPI, Express, a serverless HTTP function (Convex `httpAction`, Supabase Edge Function). The webhook needs a public HTTPS address. `localhost` is unreachable from Prodamus. If the backend already has a public host (a cloud functions URL, a preview deploy), put the webhook there and test against it; otherwise use a tunnel.
4. **Where the payment is stored**: a table with a UNIQUE key on the payment id. This is the idempotency lock.
5. **What already exists**: grep the project for `payform`, `prodamus`, `Sign`. If a webhook is already live, add a separate route for the new flow instead of new branches in the old one, and reuse its signing code after checking it against the vectors.

Environment variables. They live in the host's secret store or `.env.local`, never in the repository, a chat or a log:

```text
PRODAMUS_FORM_URL=https://<shop>.payform.ru/
PRODAMUS_SECRET_KEY=<from cabinet → Настройки>
PRODAMUS_SYS=            # optional, integration code agreed with Prodamus support
PRODAMUS_DEMO=1          # only while testing: links get demo_mode=1
```

## Steps

### 1. Signing module

Copy the module for your stack and check it before anything else:

- TypeScript: [examples/nextjs/lib/prodamus.ts](examples/nextjs/lib/prodamus.ts). It uses Web Crypto, so it runs on Node and Edge.
- Python: [examples/fastapi/main.py](examples/fastapi/main.py) (`prodamus_sign`, `prodamus_verify`).
- Zero-dependency checkers: `node scripts/prodamus_sign.mjs --check` and `python3 scripts/prodamus_sign.py --check`. Both must print `ok` for every vector in [scripts/vectors.json](scripts/vectors.json). The expected values there come from the official `Hmac.php`.

The algorithm in one line: every value to a string, keys sorted recursively, compact JSON with unicode as is **and `/` escaped as `\/`**, then hex HMAC-SHA256 with the secret key. The slash rule exists because PHP's `json_encode` escapes slashes and JavaScript's `JSON.stringify` does not. Most "the signature does not match" bugs come from this rule. Details and edge cases: [references/signature.md](references/signature.md).

### 2. Payment link

The server creates an order row first. Its id goes to Prodamus as `order_id` and comes back in the webhook as `order_num`. Then the server POSTs to the form URL, form-encoded in PHP bracket notation (`products[0][name]=…`; `toForm` in the TypeScript module and `to_form` in the Python one build it):

| field | value |
| --- | --- |
| `do` | `link`: the answer body is a short `https://payform.ru/xxxx/` URL |
| `order_id` | your order id |
| `products[0][name]` / `[price]` / `[quantity]` | product name, price in rubles, `1` |
| `customer_email`, `customer_phone` | optional prefill. The form always asks for a phone if you do not send one |
| `urlSuccess`, `urlReturn` | where the buyer lands after paying or cancelling. A redirect is **not** proof of payment |
| `urlNotification` | the webhook address for this link (alternatively set once in cabinet → Настройки) |
| `sys` | integration code, if support gave you one |
| `demo_mode` | `1` while testing |
| `signature` | signature of all the fields above |

Example: `POST /api/pay` in [examples/nextjs/app/api/pay/route.ts](examples/nextjs/app/api/pay/route.ts), `POST /pay` in the FastAPI file. Show the buyer only the short link. A long `do=pay` URL carries the whole payload, the buyer's email included, in its query string. It ends up in browser history, logs and Referer headers.

Check: call the route and get a `https://payform.ru/…` URL back. Open it. In demo mode the page says «Оплата работает в демо-режиме». Product names: write «руб», not `₽` (the page shows the symbol as «руб» anyway).

### 3. Webhook

The webhook is the only place where an order becomes paid. The order of operations is fixed:

1. **Parse** the body into a nested object, the way PHP sees `$_POST`: `products[0][name]` becomes `products: [{ name }]`. Accept `multipart/form-data`, `x-www-form-urlencoded` and JSON (links created with `callbackType=json`).
2. **Verify** the `Sign` header against the parsed object with the secret key. Drop a `signature` field if one is present. Use a constant-time compare. On a mismatch, answer 403 and stop.
3. **Branch on `payment_status`**: `success` is the only status that pays an order. Answer 200 to anything else.
4. **Record once**: insert the payment under a UNIQUE key (`order_id`, Prodamus' own payment id). A duplicate means a retry: answer 200 and do nothing else.
5. **Check the amount** (`sum`) against the order before granting anything. A matching signature proves the sender, not that this is the right order.
6. **Then the side effects** (access, email), each with `await`. Serverless workers die right after the response.
7. **Answer 200** only when the payment is safely stored. On a database error answer 500, so Prodamus retries. A 200 tells Prodamus to stop sending.

Example: [examples/nextjs/app/api/prodamus/webhook/route.ts](examples/nextjs/app/api/prodamus/webhook/route.ts). Payload fields, statuses and the retry schedule: [references/webhook.md](references/webhook.md).

### 4. Test in demo mode

`demo_mode=1` on the link: the payment page accepts only test cards, no money moves, and the webhook still fires. Card numbers, the demo signing key and what to look at are in [references/demo-mode.md](references/demo-mode.md). Run the whole path once: link → page → test card → webhook → row in the database → the same webhook again (still one row) → a webhook with a broken `Sign` (403). If the provider's demo acquirer is down (it was on 2026-10-25), test the webhook half by posting a self-signed payload; the reference explains how.

### 5. Go live

A webhook that records payments is money code. If the `second-opinion` skill is installed, run it on the signing module and the webhook before this step. Then remove `PRODAMUS_DEMO`, deploy, run one real payment for the smallest amount, refund it from the cabinet («Список платежей» → payment → refund), and check the "payment went through" list below.

## Done when

- [ ] `scripts/prodamus_sign.* --check` prints `ok` for every vector, and the project's own signer reproduces the same values.
- [ ] The link route returns a short `https://payform.ru/…` link; the secret key is in env only.
- [ ] A demo payment created a payment row; the replayed webhook did not create a second one.
- [ ] A webhook with a wrong `Sign` gets 403 and changes nothing.
- [ ] `urlSuccess` alone marks nothing as paid.
- [ ] Success, cancel and failure pages exist and say what happens next.
- [ ] Before launch: demo mode is off, one minimum real payment went through and was refunded.

## References

- [references/signature.md](references/signature.md): the algorithm step by step, PHP vs JS differences, the vectors, debugging a mismatch.
- [references/webhook.md](references/webhook.md): payload fields, `order_id` vs `order_num`, statuses, retries, idempotency.
- [references/demo-mode.md](references/demo-mode.md): demo mode, test cards, the demo key, the end-to-end test script.
- [references/sources.md](references/sources.md): primary documentation links with the dates they were checked.
