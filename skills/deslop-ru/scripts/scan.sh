#!/usr/bin/env bash
# Runs the humanizer-ru scanner (https://github.com/ilyautov/humanizer-ru, by Ilya Utov).
# Usage: scan.sh text.txt [--genre news] [--before before.txt]
# First run clones the scanner and installs its packages into a local venv under $TMPDIR.
set -euo pipefail
ROOT="${TMPDIR:-/tmp}/humanizer-ru"
VENV="${TMPDIR:-/tmp}/humanizer-ru-venv"
SCAN="$ROOT/skills/humanizer-ru/scripts/scan.py"
# The temp dir can be partly wiped by the OS: check that the files work, not that the folders exist.
if [ ! -f "$SCAN" ]; then
  rm -rf "$ROOT"
  git clone --depth 1 https://github.com/ilyautov/humanizer-ru "$ROOT" >/dev/null 2>&1
fi
if ! "$VENV/bin/python" -c "import razdel, pymorphy3" >/dev/null 2>&1; then
  rm -rf "$VENV"
  python3 -m venv "$VENV"
  "$VENV/bin/pip" install -q pymorphy3==2.0.6 razdel==0.5.0 pymorphy3-dicts-ru
fi
exec "$VENV/bin/python" "$SCAN" "$@"
