"""Prodamus for FastAPI: POST /pay creates a link, POST /prodamus/webhook confirms payment.

Run:  pip install fastapi uvicorn python-multipart httpx
      PRODAMUS_FORM_URL=https://<shop>.payform.ru/ PRODAMUS_SECRET_KEY=... uvicorn main:app
Signature = port of the official Hmac.php, checked against ../../scripts/vectors.json.
"""
import hashlib
import hmac
import json
import os
import re
import uuid
from urllib.parse import urlparse

import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import PlainTextResponse

app = FastAPI()


def canonicalize(value):
    if isinstance(value, dict):
        return {key: canonicalize(value[key]) for key in sorted(value)}
    if isinstance(value, list):
        return [canonicalize(item) for item in value]
    if value is None or value is False:
        return ""
    if value is True:
        return "1"
    return str(value)


def prodamus_sign(data: dict, secret: str) -> str:
    text = json.dumps(canonicalize(data), ensure_ascii=False, separators=(",", ":")).replace("/", "\\/")
    return hmac.new(secret.encode(), text.encode(), hashlib.sha256).hexdigest()


def prodamus_verify(data: dict, secret: str, header: str | None) -> bool:
    given = (header or "").strip().lower()
    rest = {key: value for key, value in data.items() if key != "signature"}
    return bool(re.fullmatch(r"[0-9a-f]{64}", given)) and hmac.compare_digest(prodamus_sign(rest, secret), given)


def to_form(data: dict, prefix: str = "") -> list[tuple[str, str]]:
    """Nested data -> PHP bracket notation: products[0][name]=..."""
    pairs: list[tuple[str, str]] = []
    items = enumerate(data) if isinstance(data, list) else data.items()
    for key, value in items:
        name = f"{prefix}[{key}]" if prefix else str(key)
        if isinstance(value, (dict, list)):
            pairs += to_form(value, name)
        else:
            pairs.append((name, "" if value is None else str(value)))
    return pairs


def from_form(pairs) -> dict:
    """products[0][name]=... -> nested dict; keys 0..n-1 become a list, as PHP sees $_POST."""
    root: dict = {}
    for raw_key, value in pairs:
        parts = raw_key.replace("]", "").split("[")
        node = root
        for part in parts[:-1]:
            node = node.setdefault(part, {})
        node[parts[-1]] = value

    def listify(value):
        if not isinstance(value, dict):
            return value
        keys = list(value)
        if keys and keys == [str(i) for i in range(len(keys))]:
            return [listify(value[key]) for key in keys]
        return {key: listify(item) for key, item in value.items()}

    return listify(root)


async def create_payment_link(order_id: str, name: str, price: int, base: str, demo: bool) -> str:
    form_url = os.environ["PRODAMUS_FORM_URL"]
    secret = os.environ["PRODAMUS_SECRET_KEY"]
    data = {
        "do": "link",
        "order_id": order_id,
        "products": [{"name": name, "price": str(price), "quantity": "1"}],
        "urlSuccess": f"{base}/pay/thanks?order={order_id}",
        "urlReturn": f"{base}/pay",
        "urlNotification": f"{base}/prodamus/webhook",
    }
    if os.environ.get("PRODAMUS_SYS"):
        data["sys"] = os.environ["PRODAMUS_SYS"]
    if demo:
        data["demo_mode"] = "1"
    data["signature"] = prodamus_sign(data, secret)
    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.post(form_url, data=dict(to_form(data)))
    link = response.text.strip()
    host = urlparse(link).hostname or ""
    if response.status_code != 200 or not link.startswith("https://") or not (host == "payform.ru" or host.endswith(".payform.ru")):
        raise RuntimeError(f"Prodamus did not return a link (HTTP {response.status_code})")
    return link


SEEN: set[str] = set()  # replace with a UNIQUE constraint in your database


@app.post("/pay")
async def pay(request: Request):
    order_id = f"order-{uuid.uuid4()}"  # create the order row first; it returns as order_num
    base = str(request.base_url).rstrip("/")
    try:
        url = await create_payment_link(order_id, "Access to the course", 100, base, os.environ.get("PRODAMUS_DEMO") == "1")
    except RuntimeError as error:
        raise HTTPException(status_code=502, detail="payment_unavailable") from error
    return {"orderId": order_id, "url": url}


@app.post("/prodamus/webhook", response_class=PlainTextResponse)
async def webhook(request: Request):
    secret = os.environ["PRODAMUS_SECRET_KEY"]
    if "application/json" in request.headers.get("content-type", ""):
        data = await request.json()
    else:
        form = await request.form()  # multipart/form-data or x-www-form-urlencoded
        data = from_form((key, str(value)) for key, value in form.multi_items())
    sign = request.headers.get("sign")
    live = prodamus_verify(data, secret, sign)
    demo = not live and os.environ.get("PRODAMUS_DEMO") == "1" and prodamus_verify(data, secret + "demo", sign)
    if not live and not demo:
        return PlainTextResponse("invalid signature", status_code=403)
    if data.get("payment_status") != "success":
        return "OK"
    key = f"prodamus:{data.get('order_id') or data.get('order_num')}"
    if key not in SEEN:
        SEEN.add(key)
        # grant access here; check data["sum"] against the order first
    return "OK"
