#!/bin/bash
# Run once after cloning: bash scripts/setup-git-secrets.sh
# Requires git-secrets: brew install git-secrets
# https://github.com/awslabs/git-secrets
set -e

if ! command -v git-secrets &> /dev/null; then
  echo "ERROR: git-secrets is not installed."
  echo "Install it with: brew install git-secrets"
  exit 1
fi

echo "Installing git-secrets hooks..."
git secrets --install -f

echo "Registering AWS patterns (includes AKIA key prefix)..."
git secrets --register-aws

echo "Allowing .env.example for AWS (AKIA) and Stripe patterns..."
git config --get-all secrets.allowed 2>/dev/null | grep -qF '^\.env\.example$' || \
  git secrets --add --allowed '^\.env\.example$'

echo "Registering Stripe secret key patterns..."
git config --get-all secrets.patterns 2>/dev/null | grep -qF 'sk_live_' || \
  git secrets --add 'sk_live_[0-9a-zA-Z]+'
git config --get-all secrets.patterns 2>/dev/null | grep -qF 'sk_test_' || \
  git secrets --add 'sk_test_[0-9a-zA-Z]+'

echo ""
echo "Done. git-secrets pre-commit hook installed."
