# Prodamus signature

Source of truth: the official `Hmac.php` linked from «Документация для самостоятельной интеграции сервисов» on help.prodamus.ru (checked 2026-10-25). In PHP the whole thing is `hash_hmac('sha256', json_encode(sorted strval data, JSON_UNESCAPED_UNICODE), $key)`.

## Algorithm

1. Take the request data as a nested structure: the object you send for a link, or the parsed webhook body for a check.
2. Convert every scalar to a string, the way PHP's `strval` does: numbers become their decimal text, `null` becomes `""`, `true` becomes `"1"`, `false` becomes `""`. Pass strings in the first place and these cases never matter.
3. Sort object keys alphabetically, recursively. Lists (`products`) keep their order.
4. Encode as compact JSON: no spaces, unicode left as is (Cyrillic stays Cyrillic, no `Д`).
5. Replace every `/` with `\/`. PHP `json_encode` does this by default; `JSON.stringify` and Python `json.dumps` do not.
6. HMAC-SHA256 of that string with the form's secret key, as lowercase hex.

For a link, the result goes into the `signature` field. For a webhook, compare it with the `Sign` header: case-insensitive, constant time, after removing a `signature` field from the data if there is one (`Hmac::verify` signs the data without it).

## Vectors

[../scripts/vectors.json](../scripts/vectors.json) holds three known answers computed with the official `Hmac.php` on PHP 8:

| name | what it covers |
| --- | --- |
| `demo-form-link` | a `do=link` request signed with the public demo-form key from the Prodamus docs: Cyrillic product name, URLs with slashes and a query string |
| `webhook-success` | the shape of a real success webhook (`order_id`, `order_num`, `sum`, `products[0][…]`, `payment_status`…) with fake values |
| `third-party-imnadsa` | the vector from imnadsa/prodamus-subscription-skill: a number, a `null`, a nested `subscription` object. PHP gives the same value that project expects |

Both scripts in `../scripts/` and both examples reproduce all three. If you write your own signer, run it against these values before the first real payment.

## Where implementations go wrong

| symptom | cause |
| --- | --- |
| signature never matches when the data has a URL | `/` not escaped |
| matches for Latin names, fails for Cyrillic ones | unicode escaped (`ensure_ascii=True` in Python, `\u` escapes) |
| fails only for webhooks | the body was signed as a flat list of `products[0][name]` keys; it has to be rebuilt into `products: [{…}]` first |
| fails after a framework upgrade | the parser now returns numbers or booleans; normalise to strings before signing |
| fails on keys `products[0]`, `products[2]` with a gap | PHP encodes a non-sequential array as an object `{"0":…,"2":…}`; only turn keys `0..n-1` into a list |
| matches locally, fails in production | a different secret in production env, or a proxy that rewrites the body. Log the field names, never the values |
| a demo payment fails while live ones pass | demo payments may use a demo key, see [demo-mode.md](demo-mode.md) |

Debugging tip: log the canonical JSON with values masked and compare its key order and escaping with `node scripts/prodamus_sign.mjs` run on the same object. Never log the secret, the signature input with personal data, or the full webhook body in a shared log.
