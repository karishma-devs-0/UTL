const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Firebase compatibility fixes for Expo SDK 53
// Allow .cjs files
config.resolver.sourceExts = config.resolver.sourceExts || [];
if (!config.resolver.sourceExts.includes('cjs')) {
  config.resolver.sourceExts.push('cjs');
}

// Disable the new, stricter "package.json exports" resolution 
// until every dependency ships full export maps.
config.resolver.unstable_enablePackageExports = false;

// Optimize bundle size
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    mangle: {
      keep_fnames: true,
    },
    output: {
      ascii_only: true,
      quote_keys: true,
      wrap_iife: true,
    },
    sourceMap: {
      includeSources: false,
    },
    toplevel: false,
    warnings: false,
  },
};

// Enable asset optimization
config.resolver.assetExts = [
  ...config.resolver.assetExts,
  'webp',
];

module.exports = config; 