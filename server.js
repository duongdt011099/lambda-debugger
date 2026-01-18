const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 4000;

// Logging utility
function log(...args) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}]`, ...args);
}

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

    log(`Invoking handler: ${handlerPath}`);
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

    log(`✓ Handler invoked successfully`);
    res.json({
      success: true,
      result
    });
  } catch (err) {
    log(`✗ Invocation error: ${err.message}`);
    console.error(err);
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
 * Start server with Inspector Protocol support
 */
const inspector = require('inspector');

app.listen(PORT, () => {
  log('='.repeat(50));
  log('Lambda Debugger - Background Service');
  log('='.repeat(50));
  log(`UI:        http://localhost:${PORT}`);
  log(`API:       POST http://localhost:${PORT}/invoke`);
  log(`Health:    GET http://localhost:${PORT}/health`);
  
  // Inspector/debugger info
  if (process.env.NODE_OPTIONS?.includes('--inspect')) {
    log(`Debugger:  Ready (attach VS Code to debug)`);
  } else {
    log(`Note: Start with --inspect flag to enable VS Code debugging:`);
    log(`      node --inspect server.js`);
  }
  
  log('='.repeat(50));
  log('Manage daemon: lambda-debugger [start|stop|status|restart]');
  log('='.repeat(50));
});
