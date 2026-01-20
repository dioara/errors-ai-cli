import chalk from 'chalk';
import { deleteCredentials, hasCredentials } from '../auth/credentials.js';

export async function logoutCommand() {
  try {
    if (!hasCredentials()) {
      console.log(chalk.yellow('\n⚠️  Not logged in.\n'));
      return;
    }
    
    console.log(chalk.blue('\n🔓 Logging out...\n'));
    
    deleteCredentials();
    
    console.log(chalk.green('✅ Credentials removed from ~/.errors-ai/credentials.json\n'));
    console.log(chalk.gray(`You can log back in with: ${chalk.white('errors-ai login')}\n`));
    
  } catch (error) {
    console.error(chalk.red(`\n❌ Logout failed: ${error.message}\n`));
    process.exit(1);
  }
}
