const path = require('path');

/** @type {import('metro-config').MetroConfig} */
module.exports = {
  resolver: {
    nodeModulesPaths: [
      path.resolve(__dirname, 'node_modules'),
    ],
    resolverMainFields: ['react-native', 'browser', 'main'],
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
};