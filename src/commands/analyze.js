import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs';
import { ErrorsAIClient } from '../api/client.js';
import { getFilesToAnalyze } from '../utils/file-scanner.js';
import { loadConfig } from '../config/manager.js';
import { formatText } from '../formatters/text.js';
import { formatJSON } from '../formatters/json.js';
import { formatGitHubActions } from '../formatters/github-actions.js';

export async function analyzeCommand(targetPath, options) {
  const spinner = ora();
  
  try {
    // Load config
    const config = loadConfig();
    
    // Merge options with config
    const analysisType = options.type || config.analysis_type || 'code_errors';
    const outputFormat = options.format || config.output_format || 'text';
    const saveHistory = options.saveHistory || config.save_history || false;
    const excludePatterns = Array.isArray(options.exclude) ? options.exclude : 
                           (options.exclude ? [options.exclude] : config.exclude || []);
    
    // Get files to analyze
    spinner.start('Scanning files...');
    const files = await getFilesToAnalyze(targetPath, {
      exclude: excludePatterns
    });
    spinner.stop();
    
    if (files.length === 0) {
      console.log(chalk.yellow('\n⚠️  No files found to analyze.\n'));
      return;
    }
    
    console.log(chalk.blue(`\n🔍 Found ${files.length} file(s) to analyze\n`));
    
    // Create API client
    const client = new ErrorsAIClient();
    
    // Analyze each file
    const results = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileName = file.split('/').pop();
      
      spinner.start(`Analyzing ${fileName} (${i + 1}/${files.length})...`);
      
      try {
        const startTime = Date.now();
        
        const result = await client.analyzeFile(file, {
          type: analysisType,
          language: options.language,
          saveHistory
        });
        
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        
        // Add metadata
        result.file = file;
        result.duration = duration;
        result.analysisType = analysisType;
        
        // Calculate summary if not provided
        if (!result.summary && result.errors) {
          result.summary = {
            total: result.errors.length,
            critical: result.errors.filter(e => e.severity === 'critical').length,
            high: result.errors.filter(e => e.severity === 'high').length,
            medium: result.errors.filter(e => e.severity === 'medium').length,
            low: result.errors.filter(e => e.severity === 'low').length
          };
        }
        
        results.push(result);
        spinner.succeed(`Analyzed ${fileName}`);
        
      } catch (error) {
        spinner.fail(`Failed to analyze ${fileName}: ${error.message}`);
      }
    }
    
    console.log('');
    
    // Format and display results
    for (const result of results) {
      let output;
      
      switch (outputFormat) {
        case 'json':
          output = formatJSON(result);
          break;
        case 'github-actions':
          output = formatGitHubActions(result);
          break;
        default:
          output = formatText(result, { analysisType });
      }
      
      // Save to file or print to console
      if (options.output) {
        fs.writeFileSync(options.output, output);
        console.log(chalk.green(`✅ Results saved to: ${options.output}\n`));
      } else {
        console.log(output);
      }
    }
    
    // Overall summary
    if (results.length > 1) {
      const totalIssues = results.reduce((sum, r) => sum + (r.errors?.length || 0), 0);
      console.log(chalk.bold(`\n📊 Overall Summary: ${totalIssues} issues across ${results.length} files\n`));
    }
    
  } catch (error) {
    spinner.stop();
    console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
    process.exit(1);
  }
}
