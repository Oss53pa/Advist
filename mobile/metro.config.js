const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add localStorage polyfill for SSR
config.serializer = {
  ...config.serializer,
  getModulesRunBeforeMainModule() {
    return [
      require.resolve('./src/utils/ssrPolyfill.js'),
    ];
  },
};

module.exports = config;
