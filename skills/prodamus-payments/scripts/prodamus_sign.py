#!/usr/bin/env python3
"""Prodamus signature (HMAC-SHA256 over canonical JSON), standard library only.

Port of the official Hmac.php from help.prodamus.ru:
  1. every scalar -> str (None -> "", True -> "1", False -> "", PHP strval)
  2. dict keys sorted, recursively (lists keep their order)
  3. compact JSON, unicode as is, "/" escaped as "\\/" (PHP json_encode default)
  4. hex HMAC-SHA256 with the secret key of the payment form

Usage:
  python3 prodamus_sign.py --check                     verify against vectors.json
  PRODAMUS_SECRET=... python3 prodamus_sign.py '{"order_id":"1"}'
"""
import hashlib
import hmac
import json
import os
import sys
from pathlib import Path


def canonicalize(value):
    if isinstance(value, dict):
        return {key: canonicalize(value[key]) for key in sorted(value)}
    if isinstance(value, (list, tuple)):
        return [canonicalize(item) for item in value]
    if value is None or value is False:
        return ""
    if value is True:
        return "1"
    return str(value)


def canonical_json(data) -> str:
    text = json.dumps(canonicalize(data), ensure_ascii=False, separators=(",", ":"))
    return text.replace("/", "\\/")


def sign(data, secret: str) -> str:
    return hmac.new(secret.encode(), canonical_json(data).encode(), hashlib.sha256).hexdigest()


def verify(data: dict, secret: str, header: str) -> bool:
    given = (header or "").strip().lower()
    rest = {key: value for key, value in data.items() if key != "signature"}
    return hmac.compare_digest(sign(rest, secret), given)


def _check() -> int:
    vectors = json.loads((Path(__file__).parent / "vectors.json").read_text("utf-8"))["vectors"]
    failed = 0
    for v in vectors:
        got = sign(v["data"], v["secret"])
        ok = got == v["expected"] and verify({**v["data"], "signature": got}, v["secret"], got.upper())
        failed += 0 if ok else 1
        print(f"{'ok  ' if ok else 'FAIL'} {v['name']} {got}")
    return 1 if failed else 0


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--check":
        sys.exit(_check())
    if len(sys.argv) > 1:
        secret = os.environ.get("PRODAMUS_SECRET")
        if not secret:
            sys.exit("Set PRODAMUS_SECRET in the environment (never pass it as an argument).")
        print(sign(json.loads(sys.argv[1]), secret))
        sys.exit(0)
    sys.exit("Usage: prodamus_sign.py --check | prodamus_sign.py '<json>'")
