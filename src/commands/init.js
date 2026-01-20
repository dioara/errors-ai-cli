import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { createConfigInteractive, saveConfig } from '../config/manager.js';

export async function initCommand(options) {
  try {
    const configPath = path.join(process.cwd(), '.errors-ai.yml');
    
    // Check if config already exists
    if (fs.existsSync(configPath) && !options.force) {
      console.log(chalk.yellow('\n⚠️  Configuration file already exists: .errors-ai.yml\n'));
      console.log(chalk.gray(`Use ${chalk.white('--force')} to overwrite.\n`));
      return;
    }
    
    console.log(chalk.blue('\n🎯 Initializing Errors.AI configuration...\n'));
    
    // Create config interactively
    const config = await createConfigInteractive();
    
    // Save config
    saveConfig(config, configPath);
    
    console.log(chalk.green('\n✅ Configuration saved to .errors-ai.yml\n'));
    console.log(chalk.gray('You can now run:'));
    console.log(chalk.white('  errors-ai analyze src/\n'));
    
  } catch (error) {
    console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
    process.exit(1);
  }
}
