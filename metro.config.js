const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname, {
  isCSSEnabled: true,
});

// Ensure mjs is resolved
config.resolver.sourceExts.push('mjs');

module.exports = config;
