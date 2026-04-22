const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

// Limit watch scope (helps EMFILE on large folders).
config.watchFolders = [projectRoot];

// Metro's nodeModulesPaths entries must be *parent* dirs where a `node_modules` folder
// lives — not `.../node_modules` itself. A wrong path breaks bare imports from
// `@react-navigation/*`. Pin peer deps explicitly instead:
const nm = (...parts) => path.join(projectRoot, 'node_modules', ...parts);
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  'react-native-safe-area-context': nm('react-native-safe-area-context'),
  'react-native-screens': nm('react-native-screens'),
};

config.resolver.sourceExts.push('cjs');

module.exports = config;

