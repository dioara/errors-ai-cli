import chalk from 'chalk';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

export async function versionCommand() {
  try {
    // Get package.json path
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const packagePath = path.join(__dirname, '../../package.json');
    
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
    
    console.log(chalk.green(`\nErrors.AI CLI v${packageJson.version}`));
    console.log(chalk.gray(`Node.js ${process.version}`));
    console.log(chalk.gray(`Platform: ${process.platform}-${process.arch}\n`));
    
  } catch (error) {
    console.log(chalk.green('\nErrors.AI CLI v1.0.0\n'));
  }
}
