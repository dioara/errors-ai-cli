/**
 * Format analysis results as JSON
 */
export function formatJSON(result, options = {}) {
  const pretty = options.pretty !== false;
  
  const output = {
    file: result.file || null,
    language: result.language || null,
    analysisType: result.analysisType || 'code_errors',
    timestamp: new Date().toISOString(),
    errors: result.errors || [],
    summary: result.summary || {
      total: result.errors?.length || 0,
      critical: result.errors?.filter(e => e.severity === 'critical').length || 0,
      high: result.errors?.filter(e => e.severity === 'high').length || 0,
      medium: result.errors?.filter(e => e.severity === 'medium').length || 0,
      low: result.errors?.filter(e => e.severity === 'low').length || 0
    },
    duration: result.duration || null
  };
  
  return JSON.stringify(output, null, pretty ? 2 : 0);
}
