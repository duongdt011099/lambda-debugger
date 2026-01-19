// loader.js

const path = require('path');

module.exports.loadHandler = async (handlerSpec) => {
  // "/abs/path/file.js:handler" or "C:\\abs\\path\\file.mjs:handler"
  const lastColon = handlerSpec.lastIndexOf(':');
  if (lastColon === -1) {
    throw new Error('Invalid handler spec');
  }
  const filePathRaw = handlerSpec.slice(0, lastColon);
  const exportName = handlerSpec.slice(lastColon + 1);

  if (!filePathRaw || !exportName) {
    throw new Error('Invalid handler spec');
  }

  // Normalize slashes for cross-platform compatibility
  const filePath = filePathRaw.replace(/[/\\]+/g, path.sep);
  const absPath = path.resolve(filePath);

  let mod;
  if (absPath.endsWith('.mjs')) {
    // Dynamic import for ESM
    mod = await import('file://' + absPath);
  } else {
    // CommonJS require
    delete require.cache[require.resolve(absPath)];
    mod = require(absPath);
  }

  if (!mod[exportName]) {
    throw new Error(`Export "${exportName}" not found`);
  }

  return mod[exportName];
};
