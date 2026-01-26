#!/bin/bash

# Publish to both npm and GitHub Packages
# Usage: ./scripts/publish-all.sh

set -e

echo "Building package..."
npm run build

echo ""
echo "Publishing to npm registry..."
npm publish

echo ""
echo "Publishing to GitHub Packages..."

# Temporarily update package.json for GitHub Packages (requires scoped name)
sed -i 's/"name": "groq-rag"/"name": "@mithun50\/groq-rag"/' package.json

# Publish to GitHub
npm publish --registry=https://npm.pkg.github.com

# Revert package.json
sed -i 's/"name": "@mithun50\/groq-rag"/"name": "groq-rag"/' package.json

echo ""
echo "Successfully published to both registries!"
echo "  - npm: groq-rag"
echo "  - GitHub: @mithun50/groq-rag"
