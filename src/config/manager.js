import fs from 'fs';
import path from 'path';
import yaml from 'yaml';

const CONFIG_FILENAME = '.errors-ai.yml';

/**
 * Default configuration
 */
export const DEFAULT_CONFIG = {
  analysis_type: 'code_errors',
  exclude: [
    'node_modules/',
    'dist/',
    'build/',
    '*.test.js',
    '*.spec.js',
    'coverage/'
  ],
  severity_threshold: 'high',
  output_format: 'text',
  save_history: false
};

/**
 * Find config file in current directory or parent directories
 */
export function findConfigFile(startDir = process.cwd()) {
  let currentDir = startDir;
  
  while (true) {
    const configPath = path.join(currentDir, CONFIG_FILENAME);
    
    if (fs.existsSync(configPath)) {
      return configPath;
    }
    
    const parentDir = path.dirname(currentDir);
    
    // Reached root directory
    if (parentDir === currentDir) {
      return null;
    }
    
    currentDir = parentDir;
  }
}

/**
 * Load configuration from file
 */
export function loadConfig(configPath = null) {
  // If no path provided, search for config file
  if (!configPath) {
    configPath = findConfigFile();
  }
  
  // If still no config found, return defaults
  if (!configPath || !fs.existsSync(configPath)) {
    return { ...DEFAULT_CONFIG };
  }
  
  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    const config = yaml.parse(content);
    
    // Merge with defaults
    return {
      ...DEFAULT_CONFIG,
      ...config
    };
  } catch (error) {
    throw new Error(`Failed to load config: ${error.message}`);
  }
}

/**
 * Save configuration to file
 */
export function saveConfig(config, configPath = null) {
  if (!configPath) {
    configPath = path.join(process.cwd(), CONFIG_FILENAME);
  }
  
  try {
    const content = yaml.stringify(config);
    fs.writeFileSync(configPath, content, 'utf-8');
    return configPath;
  } catch (error) {
    throw new Error(`Failed to save config: ${error.message}`);
  }
}

/**
 * Get a specific config value
 */
export function getConfigValue(key, config = null) {
  if (!config) {
    config = loadConfig();
  }
  
  return config[key];
}

/**
 * Set a specific config value
 */
export function setConfigValue(key, value, configPath = null) {
  const config = loadConfig(configPath);
  config[key] = value;
  return saveConfig(config, configPath);
}

/**
 * Create initial config file with prompts
 */
export async function createConfigInteractive() {
  const inquirer = (await import('inquirer')).default;
  
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'analysis_type',
      message: 'Analysis type:',
      choices: [
        { name: 'Code Errors', value: 'code_errors' },
        { name: 'Security Analysis', value: 'security_analysis' }
      ],
      default: 'code_errors'
    },
    {
      type: 'input',
      name: 'exclude',
      message: 'Exclude patterns (comma-separated):',
      default: 'node_modules/, dist/, build/, *.test.js',
      filter: (input) => input.split(',').map(s => s.trim())
    },
    {
      type: 'list',
      name: 'severity_threshold',
      message: 'Severity threshold for CI/CD:',
      choices: ['critical', 'high', 'medium', 'low'],
      default: 'high'
    },
    {
      type: 'confirm',
      name: 'save_history',
      message: 'Save analyses to web dashboard?',
      default: false
    }
  ]);
  
  const config = {
    ...DEFAULT_CONFIG,
    ...answers
  };
  
  return config;
}
