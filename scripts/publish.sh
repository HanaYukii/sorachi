#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
if [ -n "$(git status --porcelain)" ]; then
  printf '%s\n' 'Please commit your changes before publishing.' >&2
  exit 1
fi
node --check dist/app.js
node --check dist/study.js
node --test tests/*.test.mjs
git subtree push --prefix dist origin gh-pages
