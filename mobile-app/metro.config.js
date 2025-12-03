const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Reduce file watching to prevent EMFILE errors
config.watchFolders = [__dirname];
config.resolver.sourceExts.push('cjs');

module.exports = config;

