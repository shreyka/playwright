#!/bin/bash

echo "🔄 Reverting to clean state..."
git checkout -- packages/

echo "📦 Installing dependencies..."
npm install ts-morph yaml

echo "🔧 Applying comprehensive patches..."
node configurable_patches_comprehensive.js

# Check if protocol patches were applied
if grep -q "PATCH_PROTOCOL_YML: true" configurable_patches_comprehensive.js; then
    echo "🔄 Regenerating protocol files..."
    node utils/generate_channels.js
fi

echo "🏗️ Building..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build succeeded!"
    echo ""
    echo "🧪 Test with:"
    echo "  - DNS leak: node test-dns-leak.js"
    echo "  - Bot detection: node test-browserscan.js (navigate to browserscan.net)"
    echo "  - Recorder: npx playwright codegen https://example.com"
    echo "  - CDP: node test-resume.js"
else
    echo "❌ Build failed!"
fi 