#!/usr/bin/env node

const pm2 = require('pm2');
const path = require('path');
const axios = require('axios');

const DAEMON_NAME = 'lambda-debugger';
const DAEMON_PORT = 4000;

/**
 * Initialize PM2
 */
function initPM2(callback) {
  pm2.connect((err) => {
    if (err) {
      console.error('PM2 connection error:', err);
      process.exit(1);
    }
    callback();
  });
}

/**
 * Start daemon
 */
function startDaemon() {
  initPM2(() => {
    const scriptPath = path.join(__dirname, 'server.js');
    const config = {
      name: DAEMON_NAME,
      script: scriptPath,
      instances: 1,
      exec_mode: 'fork',
      node_args: '--inspect=0.0.0.0:9229',
      env: {
        NODE_ENV: 'production'
      },
      error_file: path.join(require('os').homedir(), '.lambda-debugger.err.log'),
      out_file: path.join(require('os').homedir(), '.lambda-debugger.out.log'),
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    };

    pm2.start(config, (err, apps) => {
      if (err) {
        console.error('Error starting daemon:', err);
        pm2.disconnect();
        process.exit(1);
      }
      console.log('✓ Lambda Debugger daemon started');
      console.log(`  UI: http://localhost:${DAEMON_PORT}`);
      console.log(`  API: POST http://localhost:${DAEMON_PORT}/invoke`);
      console.log(`  Debugger: Listening on port 9229`);
      console.log(`  VS Code: Attach with "Attach to Lambda Debugger" launch config`);
      console.log(`  Logs: ~/.lambda-debugger.out.log`);
      pm2.disconnect();
    });
  });
}

/**
 * Stop daemon
 */
function stopDaemon() {
  initPM2(() => {
    pm2.stop(DAEMON_NAME, (err) => {
      if (err) {
        console.error('Error stopping daemon:', err);
        pm2.disconnect();
        process.exit(1);
      }
      console.log('✓ Lambda Debugger daemon stopped');
      pm2.disconnect();
    });
  });
}

/**
 * Status of daemon
 */
function statusDaemon() {
  initPM2(() => {
    pm2.list((err, list) => {
      const daemon = list.find((p) => p.name === DAEMON_NAME);
      if (daemon) {
        console.log(`✓ Lambda Debugger is running (PID: ${daemon.pid})`);
        console.log(`  Status: ${daemon.pm2_env.status}`);
        console.log(`  URL: http://localhost:${DAEMON_PORT}`);
      } else {
        console.log('✗ Lambda Debugger daemon is not running');
      }
      pm2.disconnect();
    });
  });
}

/**
 * Invoke Lambda handler via daemon
 */
async function invoke(handlerPath, eventJson) {
  try {
    const event = JSON.parse(eventJson || '{}');
    const response = await axios.post(`http://localhost:${DAEMON_PORT}/invoke`, {
      handlerPath,
      event
    });

    if (response.data.success) {
      console.log('✓ Invocation successful');
      console.log(JSON.stringify(response.data.result, null, 2));
    } else {
      console.error('✗ Invocation failed:', response.data.error);
      process.exit(1);
    }
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      console.error('✗ Lambda Debugger daemon is not running. Start it with: lambda-debugger start');
      process.exit(1);
    }
    console.error('✗ Error:', err.message);
    process.exit(1);
  }
}

/**
 * Restart daemon
 */
function restartDaemon() {
  initPM2(() => {
    pm2.restart(DAEMON_NAME, (err) => {
      if (err) {
        console.error('Error restarting daemon:', err);
        pm2.disconnect();
        process.exit(1);
      }
      console.log('✓ Lambda Debugger daemon restarted');
      pm2.disconnect();
    });
  });
}

/**
 * Main CLI
 */
const command = process.argv[2];
const args = process.argv.slice(3);

switch (command) {
  case 'start':
    startDaemon();
    break;
  case 'stop':
    stopDaemon();
    break;
  case 'status':
    statusDaemon();
    break;
  case 'restart':
    restartDaemon();
    break;
  case 'invoke':
    if (!args[0]) {
      console.error('Usage: lambda-debugger invoke <handlerPath> [eventJson]');
      console.error('Example: lambda-debugger invoke /path/to/handler.js:main \'{"key":"value"}\'');
      process.exit(1);
    }
    invoke(args[0], args[1]);
    break;
  case 'logs':
    console.log(`Logs are stored at: ~/.lambda-debugger.out.log`);
    console.log(`Tail logs: tail -f ~/.lambda-debugger.out.log`);
    break;
  case 'help':
  case '--help':
  case '-h':
    console.log(`
Lambda Debugger CLI

Usage:
  lambda-debugger <command> [options]

Commands:
  start                Start the Lambda Debugger daemon
  stop                 Stop the Lambda Debugger daemon
  status               Show daemon status
  restart              Restart the daemon
  invoke <path> [evt]  Invoke a Lambda handler
                       path format: /absolute/path/handler.js:functionName
                       evt: optional JSON event string
  logs                 Show log file location
  help                 Show this help message

Examples:
  lambda-debugger start
  lambda-debugger status
  lambda-debugger invoke /home/user/handler.js:main '{"key":"value"}'
  lambda-debugger stop

UI Access:
  Open http://localhost:4000 in your browser
    `);
    break;
  default:
    console.error(`Unknown command: ${command}`);
    console.error(`Run 'lambda-debugger help' for usage information`);
    process.exit(1);
}
