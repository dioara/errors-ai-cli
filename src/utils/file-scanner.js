import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

/**
 * Check if path is a file or directory
 */
export function isDirectory(filePath) {
  try {
    return fs.statSync(filePath).isDirectory();
  } catch (error) {
    return false;
  }
}

/**
 * Check if file should be analyzed based on extension
 */
export function isAnalyzableFile(filePath) {
  const ext = path.extname(filePath).slice(1).toLowerCase();
  
  const supportedExtensions = [
    'js', 'jsx', 'mjs', 'cjs',
    'ts', 'tsx',
    'py', 'pyw',
    'java',
    'cpp', 'cc', 'cxx', 'c++', 'c', 'h',
    'go',
    'rs',
    'php',
    'rb',
    'swift',
    'kt', 'kts',
    'cs',
    'scala',
    'r'
  ];
  
  return supportedExtensions.includes(ext);
}

/**
 * Check if file matches exclude pattern
 */
export function matchesExcludePattern(filePath, excludePatterns = []) {
  const normalizedPath = filePath.replace(/\\/g, '/');
  
  for (const pattern of excludePatterns) {
    // Simple glob-like matching
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    
    const regex = new RegExp(regexPattern);
    
    if (regex.test(normalizedPath)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Scan directory for analyzable files
 */
export async function scanDirectory(dirPath, options = {}) {
  const excludePatterns = options.exclude || [];
  const maxFiles = options.maxFiles || 1000;
  
  try {
    // Use glob to find all files recursively
    const pattern = path.join(dirPath, '**/*');
    const files = await glob(pattern, {
      nodir: true,
      dot: false,
      ignore: excludePatterns.map(p => path.join(dirPath, p))
    });
    
    // Filter to only analyzable files
    const analyzableFiles = files
      .filter(file => isAnalyzableFile(file))
      .filter(file => !matchesExcludePattern(file, excludePatterns))
      .slice(0, maxFiles);
    
    return analyzableFiles;
  } catch (error) {
    throw new Error(`Failed to scan directory: ${error.message}`);
  }
}

/**
 * Get files to analyze from path (file or directory)
 */
export async function getFilesToAnalyze(targetPath, options = {}) {
  if (!fs.existsSync(targetPath)) {
    throw new Error(`Path not found: ${targetPath}`);
  }
  
  if (isDirectory(targetPath)) {
    return await scanDirectory(targetPath, options);
  } else {
    // Single file
    if (!isAnalyzableFile(targetPath)) {
      throw new Error(`File type not supported: ${targetPath}`);
    }
    return [targetPath];
  }
}

/**
 * Get file stats
 */
export function getFileStats(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').length;
  const size = fs.statSync(filePath).size;
  
  return {
    lines,
    size,
    sizeKB: Math.round(size / 1024)
  };
}
