import http from 'http';
import { randomBytes } from 'crypto';
import open from 'open';
import chalk from 'chalk';

/**
 * Generate human-readable verification code
 */
function generateVerificationCode() {
  const words = ['ALPHA', 'BRAVO', 'CHARLIE', 'DELTA', 'ECHO', 'FOXTROT', 'GOLF', 'HOTEL'];
  const word = words[Math.floor(Math.random() * words.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${word}-${num}`;
}

/**
 * Start local HTTP server to receive OAuth callback
 */
async function startCallbackServer(port, expectedCode, timeout = 300000) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, `http://localhost:${port}`);
      
      if (url.pathname === '/callback') {
        const code = url.searchParams.get('code');
        const apiKey = url.searchParams.get('key');
        const email = url.searchParams.get('email');
        const error = url.searchParams.get('error');
        
        // Handle error from auth server
        if (error) {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end(getErrorPage(error));
          server.close();
          reject(new Error(error));
          return;
        }
        
        // Validate verification code
        if (code !== expectedCode) {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end(getErrorPage('Invalid verification code'));
          server.close();
          reject(new Error('Invalid verification code'));
          return;
        }
        
        // Validate required parameters
        if (!apiKey || !email) {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end(getErrorPage('Missing required parameters'));
          server.close();
          reject(new Error('Missing API key or email'));
          return;
        }
        
        // Success!
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(getSuccessPage());
        
        server.close();
        resolve({ apiKey, email });
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
      }
    });
    
    server.on('error', (error) => {
      reject(new Error(`Failed to start local server: ${error.message}`));
    });
    
    server.listen(port, () => {
      // Server started successfully
    });
    
    // Timeout after specified duration (default 5 minutes)
    setTimeout(() => {
      server.close();
      reject(new Error('Authentication timeout - no response received'));
    }, timeout);
  });
}

/**
 * Success page HTML
 */
function getSuccessPage() {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Authentication Successful</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          padding: 20px;
        }
        .container {
          background: white;
          padding: 60px 40px;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          text-align: center;
          max-width: 500px;
          width: 100%;
        }
        .checkmark {
          font-size: 80px;
          margin-bottom: 20px;
          animation: scaleIn 0.5s ease-out;
        }
        @keyframes scaleIn {
          from { transform: scale(0); }
          to { transform: scale(1); }
        }
        h1 {
          color: #10b981;
          font-size: 32px;
          margin-bottom: 16px;
          font-weight: 700;
        }
        p {
          color: #6b7280;
          font-size: 18px;
          line-height: 1.6;
        }
        .terminal {
          background: #1f2937;
          color: #10b981;
          padding: 16px;
          border-radius: 8px;
          margin-top: 24px;
          font-family: 'Monaco', 'Courier New', monospace;
          font-size: 14px;
          text-align: left;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="checkmark">✅</div>
        <h1>Authentication Successful!</h1>
        <p>You can now close this window and return to your terminal.</p>
        <div class="terminal">
          $ errors-ai analyze src/
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Error page HTML
 */
function getErrorPage(errorMessage) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Authentication Failed</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          padding: 20px;
        }
        .container {
          background: white;
          padding: 60px 40px;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          text-align: center;
          max-width: 500px;
          width: 100%;
        }
        .error-icon {
          font-size: 80px;
          margin-bottom: 20px;
        }
        h1 {
          color: #ef4444;
          font-size: 32px;
          margin-bottom: 16px;
          font-weight: 700;
        }
        p {
          color: #6b7280;
          font-size: 18px;
          line-height: 1.6;
        }
        .error-message {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #991b1b;
          padding: 16px;
          border-radius: 8px;
          margin-top: 24px;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="error-icon">❌</div>
        <h1>Authentication Failed</h1>
        <p>There was a problem authenticating your CLI.</p>
        <div class="error-message">${errorMessage}</div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Authenticate via browser flow
 */
export async function authenticateWithBrowser(options = {}) {
  const port = options.port || 8888;
  const noBrowser = options.noBrowser || false;
  const baseURL = options.baseURL || 'https://errors.ai';
  
  // Generate verification code
  const code = generateVerificationCode();
  
  // Create auth URL
  const authUrl = `${baseURL}/cli/auth?code=${code}`;
  
  console.log(chalk.blue('\n🔐 Authenticating with Errors.AI...\n'));
  
  if (!noBrowser) {
    console.log(chalk.gray(`Opening browser to: ${authUrl}\n`));
    try {
      await open(authUrl);
    } catch (error) {
      console.log(chalk.yellow('Could not open browser automatically.\n'));
      console.log(chalk.yellow(`Please visit: ${authUrl}\n`));
    }
  } else {
    console.log(chalk.yellow(`Visit this URL to authenticate:\n${authUrl}\n`));
  }
  
  console.log(chalk.gray(`Verification code: ${chalk.bold(code)}`));
  console.log(chalk.gray('Waiting for authentication... ⏳\n'));
  
  try {
    // Start local server and wait for callback
    const result = await startCallbackServer(port, code);
    return result;
  } catch (error) {
    throw new Error(`Authentication failed: ${error.message}`);
  }
}
