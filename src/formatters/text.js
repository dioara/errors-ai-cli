import chalk from 'chalk';

/**
 * Format analysis results as human-readable text
 */
export function formatText(result, options = {}) {
  const { file, language, errors = [], summary } = result;
  let output = '';
  
  // Header
  output += chalk.blue(`\n🔍 Analyzing: ${file || 'code'}\n\n`);
  
  if (language) {
    output += chalk.gray(`Language: ${language}\n`);
  }
  
  output += chalk.gray(`Analysis type: ${options.analysisType || 'Code Errors'}\n`);
  output += '\n';
  output += chalk.gray('━'.repeat(70)) + '\n\n';
  
  if (errors.length === 0) {
    output += chalk.green('✅ No issues found!\n\n');
    output += chalk.gray('━'.repeat(70)) + '\n';
    return output;
  }
  
  // Group errors by severity
  const errorsBySeverity = {
    critical: errors.filter(e => e.severity === 'critical'),
    high: errors.filter(e => e.severity === 'high'),
    medium: errors.filter(e => e.severity === 'medium'),
    low: errors.filter(e => e.severity === 'low')
  };
  
  // Display critical errors
  if (errorsBySeverity.critical.length > 0) {
    output += chalk.red.bold(`🔴 CRITICAL SEVERITY (${errorsBySeverity.critical.length} issues)\n\n`);
    output += formatErrorList(errorsBySeverity.critical, options);
  }
  
  // Display high severity errors
  if (errorsBySeverity.high.length > 0) {
    output += chalk.red(`❌ HIGH SEVERITY (${errorsBySeverity.high.length} issues)\n\n`);
    output += formatErrorList(errorsBySeverity.high, options);
  }
  
  // Display medium severity errors
  if (errorsBySeverity.medium.length > 0) {
    output += chalk.yellow(`⚠️  MEDIUM SEVERITY (${errorsBySeverity.medium.length} issues)\n\n`);
    output += formatErrorList(errorsBySeverity.medium, options);
  }
  
  // Display low severity errors
  if (errorsBySeverity.low.length > 0) {
    output += chalk.blue(`ℹ️  LOW SEVERITY (${errorsBySeverity.low.length} issues)\n\n`);
    output += formatErrorList(errorsBySeverity.low, options);
  }
  
  // Summary
  output += chalk.gray('━'.repeat(70)) + '\n\n';
  output += chalk.bold('📊 Summary:\n');
  
  if (summary) {
    output += `  Total issues: ${chalk.bold(summary.total || errors.length)}\n`;
    if (summary.critical > 0) output += `  Critical: ${chalk.red(summary.critical)} | `;
    if (summary.high > 0) output += `High: ${chalk.red(summary.high)} | `;
    if (summary.medium > 0) output += `Medium: ${chalk.yellow(summary.medium)} | `;
    if (summary.low > 0) output += `Low: ${chalk.blue(summary.low)}`;
    output += '\n';
  } else {
    output += `  Total issues: ${chalk.bold(errors.length)}\n`;
  }
  
  if (result.duration) {
    output += `\n⏱️  Analysis completed in ${result.duration}s\n`;
  }
  
  output += '\n' + chalk.gray('━'.repeat(70)) + '\n';
  
  return output;
}

/**
 * Format list of errors
 */
function formatErrorList(errors, options = {}) {
  const maxErrors = options.maxErrors || 10;
  const showSuggestions = options.showSuggestions !== false;
  
  let output = '';
  const displayErrors = errors.slice(0, maxErrors);
  
  for (const error of displayErrors) {
    // Error location
    if (error.line) {
      output += chalk.gray(`  Line ${error.line}`);
      if (error.column) {
        output += chalk.gray(`:${error.column}`);
      }
      output += chalk.gray(': ');
    } else {
      output += '  ';
    }
    
    // Error message
    output += chalk.white(error.message || error.description) + '\n';
    
    // Code snippet
    if (error.code) {
      output += chalk.gray('  │ ') + chalk.white(error.code.trim()) + '\n';
      
      // Highlight error position
      if (error.column) {
        const spaces = ' '.repeat(error.column + 3);
        output += chalk.gray('  │ ') + chalk.red(spaces + '^'.repeat(Math.min(error.length || 4, 10))) + '\n';
      }
    }
    
    // Error type
    if (error.type) {
      output += chalk.gray(`  │ Type: ${error.type}\n`);
    }
    
    // Suggestion
    if (showSuggestions && error.suggestion) {
      output += chalk.gray('  │\n');
      output += chalk.cyan('  💡 Suggestion: ') + chalk.white(error.suggestion) + '\n';
    }
    
    output += '\n';
  }
  
  // Show count of remaining errors
  if (errors.length > maxErrors) {
    const remaining = errors.length - maxErrors;
    output += chalk.gray(`  ... and ${remaining} more issues\n\n`);
  }
  
  return output;
}

/**
 * Format summary for check command
 */
export function formatCheckSummary(result, threshold, passed) {
  let output = '\n';
  output += chalk.gray('━'.repeat(70)) + '\n\n';
  
  if (passed) {
    output += chalk.green('✅ Check passed!\n\n');
    output += chalk.gray(`No issues found at or above '${threshold}' severity.\n`);
  } else {
    output += chalk.red('❌ Check failed!\n\n');
    
    const { summary } = result;
    const criticalCount = summary?.critical || 0;
    const highCount = summary?.high || 0;
    const mediumCount = summary?.medium || 0;
    
    let failedCount = 0;
    if (threshold === 'critical') failedCount = criticalCount;
    else if (threshold === 'high') failedCount = criticalCount + highCount;
    else if (threshold === 'medium') failedCount = criticalCount + highCount + mediumCount;
    else failedCount = result.errors?.length || 0;
    
    output += chalk.red(`Found ${failedCount} issues at or above '${threshold}' severity.\n\n`);
    
    // Show brief list of issues
    const relevantErrors = result.errors?.filter(e => {
      if (threshold === 'critical') return e.severity === 'critical';
      if (threshold === 'high') return ['critical', 'high'].includes(e.severity);
      if (threshold === 'medium') return ['critical', 'high', 'medium'].includes(e.severity);
      return true;
    }) || [];
    
    for (const error of relevantErrors.slice(0, 5)) {
      const location = error.line ? `Line ${error.line}` : 'Unknown location';
      output += chalk.gray(`  ${result.file || 'code'}:${location} - ${error.message}\n`);
    }
    
    if (relevantErrors.length > 5) {
      output += chalk.gray(`\n  ... and ${relevantErrors.length - 5} more\n`);
    }
    
    output += chalk.gray(`\nRun 'errors-ai analyze ${result.file || 'code'}' for full details.\n`);
  }
  
  output += '\n' + chalk.gray('━'.repeat(70)) + '\n';
  
  return output;
}
