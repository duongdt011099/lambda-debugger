const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 4000;

/**
 * Middleware
 */
app.use(bodyParser.json({ limit: '5mb' }));

/**
 * Serve UI
 */
app.use('/', express.static(path.join(__dirname, 'ui')));

/**
 * Utility: load lambda handler dynamically
 * handlerSpec format:
 *   /absolute/path/to/file.js:handler
 */
function loadHandler(handlerSpec) {
  if (!handlerSpec || typeof handlerSpec !== 'string') {
    throw new Error('handlerPath must be a string');
  }

  const parts = handlerSpec.split(':');
  if (parts.length !== 2) {
    throw new Error(
      'Invalid handlerPath. Expected format: /abs/path/file.js:exportName'
    );
  }

  const filePath = path.resolve(parts[0]);
  const exportName = parts[1];

  if (!fs.existsSync(filePath)) {
    throw new Error(`Handler file not found: ${filePath}`);
  }

  // Hot reload: clear require cache
  delete require.cache[require.resolve(filePath)];

  const moduleExports = require(filePath);

  const handler = moduleExports[exportName];
  if (typeof handler !== 'function') {
    throw new Error(`Export "${exportName}" is not a function`);
  }

  return handler;
}

/**
 * Invoke Lambda handler
 */
app.post('/invoke', async (req, res) => {
  try {
    const { handlerPath, event } = req.body;

    if (!handlerPath) {
      return res.status(400).json({ error: 'handlerPath is required' });
    }

    const handler = loadHandler(handlerPath);

    const context = {
      functionName: handlerPath,
      awsRequestId: `local-${Date.now()}`,
      invokedFunctionArn: 'arn:aws:lambda:local:0:function:debug',
      getRemainingTimeInMillis: () => 30000,
      done: () => {},
      succeed: () => {},
      fail: () => {}
    };

    const result = await handler(event, context);

    res.json({
      success: true,
      result
    });
  } catch (err) {
    console.error('Invocation error:', err);
    res.status(500).json({
      success: false,
      error: err.message,
      stack: err.stack
    });
  }
});

/**
 * Health check
 */
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

/**
 * Start server
 */
app.listen(PORT, () => {
  console.log(`Lambda Debugger running`);
  console.log(`UI:      http://localhost:${PORT}`);
  console.log(`Invoke:  POST http://localhost:${PORT}/invoke`);
});
