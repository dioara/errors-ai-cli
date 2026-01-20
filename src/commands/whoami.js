import chalk from 'chalk';
import { loadCredentials } from '../auth/credentials.js';
import { ErrorsAIClient } from '../api/client.js';

export async function whoamiCommand() {
  try {
    const credentials = loadCredentials();
    
    if (!credentials) {
      console.log(chalk.yellow('\n⚠️  Not logged in.\n'));
      console.log(chalk.gray(`Run: ${chalk.white('errors-ai login')}\n`));
      return;
    }
    
    // Get user info from API
    const client = new ErrorsAIClient();
    const user = await client.whoami();
    
    console.log(chalk.green('\n✅ Logged in as: ') + chalk.white.bold(user.email) + '\n');
    
    if (user.plan) {
      console.log(chalk.gray('Plan: ') + chalk.white(user.plan));
    }
    
    // Show masked API key
    const maskedKey = credentials.apiKey.slice(0, 8) + '***' + credentials.apiKey.slice(-3);
    console.log(chalk.gray('API Key: ') + chalk.white(maskedKey));
    
    if (user.analysesToday !== undefined) {
      const limit = user.limit === null ? 'unlimited' : user.limit;
      console.log(chalk.gray('Analyses today: ') + chalk.white(`${user.analysesToday} / ${limit}`));
    }
    
    if (user.memberSince) {
      console.log(chalk.gray('Member since: ') + chalk.white(user.memberSince));
    }
    
    console.log('');
    
  } catch (error) {
    console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
    process.exit(1);
  }
}
