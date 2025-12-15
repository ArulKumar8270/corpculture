#!/bin/bash
# Script to fix React Navigation Drawer Reanimated 3 error

echo "Clearing caches and reinstalling dependencies..."

# Clear all caches
rm -rf node_modules/.cache
rm -rf .expo
rm -rf .metro
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-map-*

# Reinstall dependencies
echo "Reinstalling dependencies..."
npm install --legacy-peer-deps

# Clear watchman (if installed)
if command -v watchman &> /dev/null; then
    echo "Clearing watchman cache..."
    watchman watch-del-all
fi

echo ""
echo "Done! Now run: npm start -- --clear"
echo "This will start Metro bundler with cleared cache."

