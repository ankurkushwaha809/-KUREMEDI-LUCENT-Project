const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");
const fs = require("fs");

const config = getDefaultConfig(__dirname);
const workspaceRoot = path.resolve(__dirname, "../..");
const resolveModulePath = (moduleName) => {
  const localPath = path.resolve(__dirname, `node_modules/${moduleName}`);
  if (fs.existsSync(localPath)) return localPath;
  return path.resolve(workspaceRoot, `node_modules/${moduleName}`);
};

// Support both app-local and workspace-hoisted dependencies.
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];
config.resolver.disableHierarchicalLookup = false;

config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  react: resolveModulePath("react"),
  "react-dom": resolveModulePath("react-dom"),
  "react-native-safe-area-context": resolveModulePath(
    "react-native-safe-area-context"
  ),
  "@react-native/virtualized-lists": resolveModulePath(
    "react-native/node_modules/@react-native/virtualized-lists"
  ),
};

module.exports = withNativeWind(config, { input: "./global.css" });
