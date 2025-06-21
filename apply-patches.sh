#!/bin/bash

echo "🔄 Reverting to clean state..."
git checkout -- packages/

echo "📦 Installing dependencies..."
npm install ts-morph yaml

echo "🔧 Applying configurable patches..."
node configurable_patches.js

echo "🏗️ Building..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build succeeded!"
else
    echo "❌ Build failed!"
fi 