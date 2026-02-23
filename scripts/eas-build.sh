#!/usr/bin/env bash
# EAS build and submit script

set -e

PROJECT_DIR="${1:-.}"
cd "$PROJECT_DIR"

echo "Starting EAS build..."

eas build --platform ios --profile production --auto-submit --non-interactive

echo "EAS build and submit complete"
