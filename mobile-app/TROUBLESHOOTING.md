# Troubleshooting Guide

## EMFILE: Too Many Open Files Error

If you encounter the "EMFILE: too many open files" error, follow these steps:

### Solution 1: Increase File Descriptor Limit (Recommended)

**For current session:**
```bash
ulimit -n 4096
```

**For permanent fix (add to ~/.zshrc or ~/.bash_profile):**
```bash
echo "ulimit -n 4096" >> ~/.zshrc
source ~/.zshrc
```

### Solution 2: Install Watchman

Watchman is a file watching service that helps manage file system events:

```bash
# Install via Homebrew
brew install watchman

# Or via npm
npm install -g watchman
```

After installing, restart your terminal and try again.

### Solution 3: Clear Metro Cache

```bash
npm start -- --reset-cache
```

### Solution 4: Close Other Applications

Close unnecessary applications that might be watching files:
- VS Code (if you have many files open)
- Other development servers
- File indexing services

### Solution 5: Restart Watchman (if installed)

```bash
watchman shutdown-server
```

Then restart the Expo server.

### Solution 6: Use Expo Go Instead of Development Build

If the issue persists, try using Expo Go app on your phone instead of running in simulator:
1. Install Expo Go from App Store/Play Store
2. Run `npm start`
3. Scan QR code with Expo Go

## Other Common Issues

### Metro Bundler Won't Start

```bash
# Clear cache and restart
rm -rf node_modules
npm install
npm start -- --reset-cache
```

### iOS Build Issues

```bash
cd ios
pod install
cd ..
npm run ios
```

### Android Build Issues

1. Clean build folder in Android Studio
2. Invalidate caches: File → Invalidate Caches / Restart
3. Try again

### Port Already in Use

```bash
# Kill process on port 8081 (default Metro port)
lsof -ti:8081 | xargs kill -9

# Or use different port
npm start -- --port 8082
```

## Getting Help

If issues persist:
1. Check Expo documentation: https://docs.expo.dev/
2. Check React Native troubleshooting: https://reactnative.dev/docs/troubleshooting
3. Clear all caches and reinstall dependencies

