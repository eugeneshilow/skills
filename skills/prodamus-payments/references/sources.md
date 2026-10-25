# Sources

Primary documentation, checked 2026-10-25 unless marked otherwise.

| page | what it holds |
| --- | --- |
| [Документация для самостоятельной интеграции сервисов](https://help.prodamus.ru/payform/integracii/rest-api/instrukcii-dlya-samostoyatelnaya-integracii-servisov) | link parameters (`do`, `products`, `urlNotification`, `sys`, `demo_mode`, `callbackType`…), the signature algorithm, the downloadable `Hmac.php` / `Hmac.js`, the webhook check example, the public demo form and its key |
| [Где найти url для уведомлений и секретный ключ](https://help.prodamus.ru/payform/integracii/rest-api/url-dlya-uvedomlenii-i-sekretnyi-klyuch) | where the secret key and notification URLs are in the cabinet |
| [Как провести тестовую оплату](https://help.prodamus.ru/payform/nastroika-platezhnoi-stranicy/kak-provesti-testovuyu-oplatu) | demo mode for the whole form or one link, `demo_mode=1` for API links, test cards |
| [Как устроена отправка уведомлений об оплате](https://help.prodamus.ru/payform/uvedomleniya/kak-ustroena-otpravka-uvedomlenii-ob-oplate) | webhook format, "answer 200 or we retry", manual resend |
| [Интервалы уведомлений](https://help.prodamus.ru/payform/uvedomleniya/intervaly-uvedomlenii) | retry schedule |
| [Rest API](https://help.prodamus.ru/payform/integracii/rest-api-1) | the only REST methods: subscription management (`setActivity`, `setSubscriptionDiscount`, `setSubscriptionPaymentDate`); there is no "create payment" or "list payments" method |

Community references, read as prior art:

- [imnadsa/prodamus-subscription-skill](https://github.com/imnadsa/prodamus-subscription-skill): a Claude skill for recurring subscriptions on Prodamus, with eleven production pitfalls. Its signature vector matches the official `Hmac.php` (see `scripts/vectors.json`).
- [dnagikh/python-prodamus](https://github.com/dnagikh/python-prodamus): a Python signer. It does not escape `/`, so its signature differs whenever a value contains a slash (any URL in a link request); do not copy that part.
