# Lambda Debugger

A local debugging tool for AWS Lambda Node.js applications.

## Description

Lambda Debugger is a lightweight application that enables developers to debug AWS Lambda functions locally during development. It provides a web-based interface for testing and debugging Lambda functions without deploying to AWS.

## Features

- Local Lambda function debugging
- Web-based UI for testing
- Express.js server for handling requests
- Support for Node.js Lambda runtime

## Installation

```bash
npm install
```

## Usage

Start the debugger server:

```bash
npm start
```

The server will launch and you can access the debugging UI in your browser.

### Docker Support

You can also run Lambda Debugger using Docker:

```bash
docker build -t lambda-debugger .
docker run -p 4000:4000 lambda-debugger
```

Then access the UI at `http://localhost:4000`

### Docker Compose (Recommended for Development)

For local development with volume mounts to access your Lambda functions:

```bash
docker-compose up
```

This will:
- Mount your project directory into the container
- Expose port 4000
- Enable hot-reloading on file changes
- Access the UI at `http://localhost:4000`

To stop the container:

```bash
docker-compose down
```

## Project Structure

- `server.js` - Main Express server
- `loader.js` - Lambda function loader
- `ui/index.html` - Web-based debugging interface
- `package.json` - Project dependencies and configuration

## Dependencies

- **express** - Web framework for Node.js
- **body-parser** - Middleware for parsing request bodies
- **path** - Node.js path utilities

## License

MIT

## Author

Duong Do - [@duongdt011099](https://github.com/duongdt011099)
