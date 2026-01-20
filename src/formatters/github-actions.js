/**
 * Format analysis results for GitHub Actions annotations
 * https://docs.github.com/en/actions/using-workflows/workflow-commands-for-github-actions
 */
export function formatGitHubActions(result) {
  const { file, errors = [] } = result;
  let output = '';
  
  for (const error of errors) {
    const level = getSeverityLevel(error.severity);
    const filePath = file || 'unknown';
    const line = error.line || 1;
    const col = error.column || 1;
    const message = error.message || error.description || 'Unknown error';
    const title = error.type || 'Code Error';
    
    // GitHub Actions annotation format
    // ::error file={name},line={line},col={col},title={title}::{message}
    output += `::${level} file=${filePath},line=${line},col=${col},title=${title}::${message}\n`;
  }
  
  // Add summary
  const summary = result.summary || {};
  const total = summary.total || errors.length;
  
  if (total > 0) {
    output += `::notice::Found ${total} issues (`;
    if (summary.critical > 0) output += `${summary.critical} critical, `;
    if (summary.high > 0) output += `${summary.high} high, `;
    if (summary.medium > 0) output += `${summary.medium} medium, `;
    if (summary.low > 0) output += `${summary.low} low`;
    output += `)\n`;
  } else {
    output += `::notice::No issues found\n`;
  }
  
  return output;
}

/**
 * Map severity to GitHub Actions level
 */
function getSeverityLevel(severity) {
  switch (severity) {
    case 'critical':
    case 'high':
      return 'error';
    case 'medium':
      return 'warning';
    case 'low':
    default:
      return 'notice';
  }
}
