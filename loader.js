// loader.js
const path = require('path');

module.exports.loadHandler = (handlerSpec) => {
  // "/abs/path/file.js:handler"
  const [filePath, exportName] = handlerSpec.split(':');

  if (!filePath || !exportName) {
    throw new Error('Invalid handler spec');
  }

  const absPath = path.resolve(filePath);
  
  delete require.cache[require.resolve(absPath)];

  const mod = require(absPath);

  if (!mod[exportName]) {
    throw new Error(`Export "${exportName}" not found`);
  }

  return mod[exportName];
};
