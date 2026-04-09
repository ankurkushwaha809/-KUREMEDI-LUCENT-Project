const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Lock Metro resolution to the app's own dependencies to avoid workspace-hoisted duplicates.
config.resolver.nodeModulesPaths = [path.resolve(__dirname, "node_modules")];
config.resolver.disableHierarchicalLookup = true;

config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  react: path.resolve(__dirname, "node_modules/react"),
  "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
  "react-native-safe-area-context": path.resolve(
    __dirname,
    "node_modules/react-native-safe-area-context"
  ),
  "@react-native/virtualized-lists": path.resolve(
    __dirname,
    "node_modules/react-native/node_modules/@react-native/virtualized-lists"
  ),
};

module.exports = withNativeWind(config, { input: "./global.css" });
