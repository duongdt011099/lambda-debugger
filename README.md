# NodeJs Lambda Debugger

Debug AWS Lambda functions locally with VS Code. Works on **Windows, Mac, and Linux**.

## 5-Minute Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Debugger Service

```bash
node cli.js start
```

The service runs in the background on:
- **Port 4000** - Web UI (http://localhost:4000)
- **Port 9229** - Debugger (for VS Code)

### 3. Setup Your Lambda Project

Open your Lambda project in VS Code:
```bash
code /path/to/your/lambda/project
```

Create `.vscode/launch.json` in your project with:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Attach to Lambda Debugger",
      "type": "node",
      "request": "attach",
      "port": 9229,
      "address": "localhost",
      "restart": true
    }
  ]
}
```

### 4. Debug

Then:
1. Press `Ctrl+Shift+D` (Debug view)
2. Select **"Attach to Lambda Debugger"**
3. Click the **Play button** (or press F5)
4. Click line numbers to set breakpoints
5. Invoke your handler (choose one):

   **Option A: Web UI (Easiest)**
   - Open http://localhost:4000
   - Enter handler path: `/path/to/your/handler.js:functionName`
   - Enter event JSON: `{"event":"data"}`
   - Click **Invoke**

   **Option B: Terminal**
   ```bash
   node /path/to/lambda-debugger/cli.js invoke /path/to/your/handler.js:functionName '{"event":"data"}'
   ```

6. VS Code pauses at breakpoints. Inspect variables, step through code (F10, F11, F5).

Done! 🎉

---

## Simple Usage

### Start the Service
```bash
node cli.js start
```

### Stop the Service
```bash
node cli.js stop
```

### Check Status
```bash
node cli.js status
```

### Invoke a Handler
```bash
node cli.js invoke /absolute/path/to/handler.js:functionName '{"event":"data"}'
```

### Restart the Service
```bash
node cli.js restart
```

---

## Example

Say your Lambda project is at `/home/user/my-lambda`:

```bash
# 1. Start the service (one time)
node cli.js start

# 2. Open your project in VS Code
code /home/user/my-lambda

# 3. In VS Code: Ctrl+Shift+D → "Attach to Lambda Debugger" → Play

# 4. Open handler.js and click line numbers to set breakpoints

# 5. From another terminal, invoke:
node cli.js invoke /home/user/my-lambda/handler.js:main '{"userId":"123"}'

# 6. VS Code pauses at your breakpoint
#    Inspect variables, step through code (F10, F11, F5)
```

That's it!

---

## Windows Service (Auto-Start on Boot)

Want the debugger to start automatically when Windows boots?

### Option 1: Using Task Scheduler (Easiest)

1. Open **Task Scheduler** (search in Start menu)
2. Click **Create Basic Task**
3. **Name:** `Lambda Debugger`
4. **Trigger:** At log on
5. **Action:** 
   - Program: `node`
   - Arguments: `cli.js start`
   - Start in: `C:\path\to\lambda-debugger` (full path)
6. Click **Finish**

Now debugger starts automatically when you log in!

### Option 2: Using NSSM (Advanced)

If you need a true Windows Service:

```bash
# Install NSSM (Node Service Simple Manager)
# Download from: https://nssm.cc/download

# Install service
nssm install LambdaDebugger "node" "cli.js start" "C:\path\to\lambda-debugger"

# Start service
nssm start LambdaDebugger

# Check status
nssm status LambdaDebugger
```

---

## Linux/Mac Service (Auto-Start on Boot)

### Option 1: PM2 (Easy)

```bash
# Save PM2 configuration
npm install -g pm2
pm2 start cli.js --name lambda-debugger -- start
pm2 save
pm2 startup
```

Now debugger auto-starts on boot!

### Option 2: Systemd (Linux only)

```bash
# Copy service file
sudo cp lambda-debugger.service /etc/systemd/system/

# Enable and start
sudo systemctl enable lambda-debugger
sudo systemctl start lambda-debugger

# Check status
sudo systemctl status lambda-debugger
```

---

## How It Works

```
Your Projects (anywhere)
    ↓
Lambda Debugger Service (background)
    ↓
VS Code (attach to debug)
```

- **Service** runs once, debugs any handler
- **Projects** stay unchanged, can be anywhere
- **VS Code** attaches to the service for debugging

---

## Important: Use Absolute Paths

Always use **absolute paths** when invoking handlers:

```bash
# ✓ Correct (absolute path)
node cli.js invoke /home/user/my-lambda/handler.js:main '{"data":"test"}'

# ✗ Wrong (relative path)
node cli.js invoke ./handler.js:main '{"data":"test"}'

# ✗ Wrong (no function name)
node cli.js invoke /home/user/my-lambda/handler.js '{"data":"test"}'
```

---

## REST API (For Automation)

Invoke handlers programmatically:

```bash
curl -X POST http://localhost:4000/invoke \
  -H "Content-Type: application/json" \
  -d '{
    "handlerPath": "/path/to/handler.js:functionName",
    "event": {"key":"value"}
  }'
```

---

## Troubleshooting

**Service won't start?**
```bash
# Check errors
cat ~/.lambda-debugger.err.log

# Try running directly
node server.js
```

**Can't connect in VS Code?**
```bash
# Verify service is running
node cli.js status

# If not, start it
node cli.js start
```

**Handler not found?**
- Use absolute path: `/full/path/to/handler.js:functionName`

**Port already in use?**
```bash
# Windows: netstat -ano | findstr :4000
# Mac/Linux: lsof -i :4000

# Stop and restart
node cli.js stop
node cli.js start
```

---

## All Commands

```bash
node cli.js start     # Start service
node cli.js stop      # Stop service
node cli.js status    # Check if running
node cli.js restart   # Restart service
node cli.js invoke ... # Invoke handler
node cli.js help      # Show all commands
```

---

## Docker Support

### Option 1: Using Docker Compose (Easiest)

**Step 1: Mount your Lambda projects**

Edit `docker-compose.yml` and add volumes for your projects:

```yaml
volumes:
  - ./:/app                           # debugger project
  - /path/to/my-lambda:/home/my-lambda  # your Lambda project
  - /path/to/other-project:/home/other  # another project
  - /app/node_modules
```

**Step 2: Start the debugger**

```bash
docker-compose up
```

**Step 3: Invoke handlers**

In another terminal (on host machine):
```bash
node cli.js invoke /home/my-lambda/handler.js:functionName '{"event":"data"}'
```

The container can access your projects via the mounted volumes.

### Option 2: Using Docker Directly

```bash
# Build image
docker build -t lambda-debugger .

# Run with volume mounts for your projects
docker run -p 4000:4000 -p 9229:9229 \
  -v /path/to/my-lambda:/home/my-lambda \
  lambda-debugger node cli.js start
```

Then invoke:
```bash
node cli.js invoke /home/my-lambda/handler.js:functionName '{"event":"data"}'
```

### Debugging in Docker

VS Code attachment works the same way:
1. `Ctrl+Shift+D` → "Attach to Lambda Debugger" → Play
2. Set breakpoints
3. Invoke handler (service inside Docker executes)
4. Debug in VS Code

---

## Platform Support

| OS | Works? |
|----|--------|
| Windows | ✓ Yes |
| Mac | ✓ Yes |
| Linux | ✓ Yes |

---

## Dependencies

- **express** - Web framework for Node.js
- **body-parser** - Middleware for parsing request bodies
- **path** - Node.js path utilities

## License

MIT

## Author

Duong Do - [@duongdt011099](https://github.com/duongdt011099)
