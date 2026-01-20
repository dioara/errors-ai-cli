import chalk from 'chalk';
import { authenticateWithBrowser } from '../auth/browser-flow.js';
import { saveCredentials } from '../auth/credentials.js';

export async function loginCommand(options) {
  try {
    // Manual API key provided
    if (options.apiKey) {
      await loginWithApiKey(options.apiKey);
      return;
    }
    
    // Browser flow
    const result = await authenticateWithBrowser({
      port: parseInt(options.port) || 8888,
      noBrowser: options.noBrowser
    });
    
    // Save credentials
    saveCredentials(result.apiKey, result.email);
    
    console.log(chalk.green('\n✅ Authentication successful!\n'));
    console.log(chalk.gray(`Logged in as: ${chalk.white(result.email)}`));
    console.log(chalk.gray(`API key saved to: ${chalk.white('~/.errors-ai/credentials.json')}\n`));
    console.log(chalk.blue('You can now use the CLI to analyze code.'));
    console.log(chalk.gray(`Try: ${chalk.white('errors-ai analyze src/')}\n`));
    
  } catch (error) {
    console.error(chalk.red(`\n❌ Login failed: ${error.message}\n`));
    process.exit(2);
  }
}

async function loginWithApiKey(apiKey) {
  // Validate API key format
  if (!apiKey.startsWith('sk_live_')) {
    throw new Error('Invalid API key format. API keys should start with "sk_live_"');
  }
  
  // Test the API key by making a request
  const { ErrorsAIClient } = await import('../api/client.js');
  
  try {
    const client = new ErrorsAIClient(apiKey);
    const user = await client.whoami();
    
    // Save credentials
    saveCredentials(apiKey, user.email);
    
    console.log(chalk.green('\n✅ API key saved successfully!\n'));
    console.log(chalk.gray(`Logged in as: ${chalk.white(user.email)}\n`));
    console.log(chalk.blue('You can now use the CLI to analyze code.'));
    console.log(chalk.gray(`Try: ${chalk.white('errors-ai analyze src/')}\n`));
    
  } catch (error) {
    throw new Error(`Failed to authenticate with provided API key: ${error.message}`);
  }
}
