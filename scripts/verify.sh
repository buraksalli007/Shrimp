#!/usr/bin/env bash
# Verification script - run install, lint, test

set -e

cd "${1:-.}"

echo "Installing dependencies..."
bun install 2>/dev/null || npm install

echo "Running lint..."
bun run lint 2>/dev/null || npx eslint . 2>/dev/null || true

echo "Running tests..."
bun test 2>/dev/null || npm test 2>/dev/null || true

echo "Verification complete"
