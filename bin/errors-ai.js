#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { loginCommand } from '../src/commands/login.js';
import { logoutCommand } from '../src/commands/logout.js';
import { whoamiCommand } from '../src/commands/whoami.js';
import { analyzeCommand } from '../src/commands/analyze.js';
import { checkCommand } from '../src/commands/check.js';
import { initCommand } from '../src/commands/init.js';
import { versionCommand } from '../src/commands/version.js';

const program = new Command();

program
  .name('errors-ai')
  .description('AI-powered code analysis CLI for Errors.AI')
  .version('1.0.0');

// Login command
program
  .command('login')
  .description('Authenticate with Errors.AI')
  .option('--api-key <key>', 'Manually provide API key (skip browser flow)')
  .option('--no-browser', "Don't open browser automatically")
  .option('--port <port>', 'Local server port for OAuth callback', '8888')
  .action(loginCommand);

// Logout command
program
  .command('logout')
  .description('Remove stored credentials')
  .action(logoutCommand);

// Whoami command
program
  .command('whoami')
  .description('Show current authenticated user')
  .action(whoamiCommand);

// Analyze command
program
  .command('analyze <path>')
  .description('Analyze code and display results')
  .option('--type <type>', 'Analysis type: code_errors | security_analysis', 'code_errors')
  .option('--format <format>', 'Output format: text | json | github-actions', 'text')
  .option('--output <file>', 'Save output to file')
  .option('--save-history', 'Save analysis to web dashboard', false)
  .option('--language <lang>', 'Force language detection')
  .option('--exclude <pattern>', 'Exclude files matching pattern (can use multiple times)', [])
  .action(analyzeCommand);

// Check command
program
  .command('check <path>')
  .description('Analyze code and exit with error code (for CI/CD)')
  .option('--fail-on <severity>', 'Exit with error if issues of this severity or higher', 'high')
  .option('--format <format>', 'Output format: text | github-actions', 'text')
  .option('--exclude <pattern>', 'Exclude files matching pattern (can use multiple times)', [])
  .action(checkCommand);

// Init command
program
  .command('init')
  .description('Create .errors-ai.yml configuration file')
  .option('--force', 'Overwrite existing config file', false)
  .action(initCommand);

// Version command (also accessible via --version)
program
  .command('version')
  .description('Show CLI version')
  .action(versionCommand);

// Error handling
program.exitOverride();

try {
  await program.parseAsync(process.argv);
} catch (error) {
  if (error.code === 'commander.help' || error.code === 'commander.helpDisplayed') {
    // Help was displayed, exit normally
    process.exit(0);
  } else if (error.code === 'commander.version') {
    // Version was displayed, exit normally
    process.exit(0);
  } else {
    console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
    process.exit(1);
  }
}

// Show help if no command provided
if (process.argv.length === 2) {
  program.outputHelp();
}
