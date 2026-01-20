import chalk from 'chalk';
import ora from 'ora';
import { ErrorsAIClient } from '../api/client.js';
import { getFilesToAnalyze } from '../utils/file-scanner.js';
import { loadConfig } from '../config/manager.js';
import { formatCheckSummary } from '../formatters/text.js';
import { formatGitHubActions } from '../formatters/github-actions.js';

export async function checkCommand(targetPath, options) {
  const spinner = ora();
  
  try {
    // Load config
    const config = loadConfig();
    
    // Merge options with config
    const failOnSeverity = options.failOn || config.severity_threshold || 'high';
    const outputFormat = options.format || config.output_format || 'text';
    const excludePatterns = Array.isArray(options.exclude) ? options.exclude : 
                           (options.exclude ? [options.exclude] : config.exclude || []);
    
    // Validate severity level
    const validSeverities = ['critical', 'high', 'medium', 'low'];
    if (!validSeverities.includes(failOnSeverity)) {
      throw new Error(`Invalid severity level: '${failOnSeverity}'. Valid options: ${validSeverities.join(', ')}`);
    }
    
    // Get files to analyze
    spinner.start('Scanning files...');
    const files = await getFilesToAnalyze(targetPath, {
      exclude: excludePatterns
    });
    spinner.stop();
    
    if (files.length === 0) {
      console.log(chalk.yellow('\n⚠️  No files found to analyze.\n'));
      process.exit(0);
    }
    
    console.log(chalk.blue(`\n🔍 Checking ${files.length} file(s)...\n`));
    
    // Create API client
    const client = new ErrorsAIClient();
    
    // Analyze each file
    let totalIssues = 0;
    let failingIssues = 0;
    const allResults = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileName = file.split('/').pop();
      
      spinner.start(`Checking ${fileName} (${i + 1}/${files.length})...`);
      
      try {
        const result = await client.analyzeFile(file, {
          type: 'code_errors',
          saveHistory: false
        });
        
        result.file = file;
        
        // Calculate summary
        if (!result.summary && result.errors) {
          result.summary = {
            total: result.errors.length,
            critical: result.errors.filter(e => e.severity === 'critical').length,
            high: result.errors.filter(e => e.severity === 'high').length,
            medium: result.errors.filter(e => e.severity === 'medium').length,
            low: result.errors.filter(e => e.severity === 'low').length
          };
        }
        
        totalIssues += result.errors?.length || 0;
        
        // Count issues at or above threshold
        const issuesAtThreshold = countIssuesAtThreshold(result.errors || [], failOnSeverity);
        failingIssues += issuesAtThreshold;
        
        allResults.push(result);
        
        if (issuesAtThreshold > 0) {
          spinner.fail(`${fileName}: ${issuesAtThreshold} issue(s) at or above '${failOnSeverity}' severity`);
        } else {
          spinner.succeed(`${fileName}: passed`);
        }
        
      } catch (error) {
        spinner.fail(`Failed to check ${fileName}: ${error.message}`);
      }
    }
    
    console.log('');
    
    // Determine if check passed
    const passed = failingIssues === 0;
    
    // Output results
    if (outputFormat === 'github-actions') {
      // GitHub Actions format
      for (const result of allResults) {
        console.log(formatGitHubActions(result));
      }
    } else {
      // Text format with summary
      const combinedResult = {
        file: targetPath,
        errors: allResults.flatMap(r => r.errors || []),
        summary: {
          total: totalIssues,
          critical: allResults.reduce((sum, r) => sum + (r.summary?.critical || 0), 0),
          high: allResults.reduce((sum, r) => sum + (r.summary?.high || 0), 0),
          medium: allResults.reduce((sum, r) => sum + (r.summary?.medium || 0), 0),
          low: allResults.reduce((sum, r) => sum + (r.summary?.low || 0), 0)
        }
      };
      
      console.log(formatCheckSummary(combinedResult, failOnSeverity, passed));
    }
    
    // Exit with appropriate code
    if (passed) {
      process.exit(0);
    } else {
      process.exit(1);
    }
    
  } catch (error) {
    spinner.stop();
    console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
    
    if (error.message.includes('Not authenticated')) {
      process.exit(2);
    } else if (error.message.includes('API error') || error.message.includes('Network error')) {
      process.exit(3);
    } else {
      process.exit(4);
    }
  }
}

/**
 * Count issues at or above severity threshold
 */
function countIssuesAtThreshold(errors, threshold) {
  const severityLevels = {
    'critical': 4,
    'high': 3,
    'medium': 2,
    'low': 1
  };
  
  const thresholdLevel = severityLevels[threshold];
  
  return errors.filter(error => {
    const errorLevel = severityLevels[error.severity] || 0;
    return errorLevel >= thresholdLevel;
  }).length;
}
