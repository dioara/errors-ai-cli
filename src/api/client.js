import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { loadCredentials } from '../auth/credentials.js';

export class ErrorsAIClient {
  constructor(apiKey = null, baseURL = 'https://errors.ai') {
    // Use provided API key or load from credentials
    this.apiKey = apiKey || loadCredentials()?.apiKey;
    
    if (!this.apiKey) {
      throw new Error('Not authenticated. Run: errors-ai login');
    }
    
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'errors-ai-cli/1.0.0'
      },
      timeout: 120000 // 120 second timeout
    });
  }

  /**
   * Analyze code for errors
   */
  async analyzeCode(code, language, options = {}) {
    try {
      const response = await this.client.post('/api/analyze-code', {
        code,
        language,
        analysisType: options.type || 'code_errors',
        saveToHistory: options.saveHistory || false
      });
      
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Analyze code for security vulnerabilities
   */
  async analyzeSecurity(code, language) {
    try {
      const response = await this.client.post('/api/analyze-security', {
        code,
        language
      });
      
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Analyze a file
   */
  async analyzeFile(filePath, options = {}) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    const code = fs.readFileSync(filePath, 'utf-8');
    const language = options.language || this.detectLanguage(filePath);
    
    if (options.type === 'security') {
      return this.analyzeSecurity(code, language);
    }
    return this.analyzeCode(code, language, options);
  }

  /**
   * Get usage statistics
   */
  async getUsageStats(period = 'today') {
    try {
      const response = await this.client.get('/api/usage', {
        params: { period }
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get analysis history
   */
  async getHistory(limit = 10) {
    try {
      const response = await this.client.get('/api/history', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get current user info
   */
  async whoami() {
    try {
      const response = await this.client.get('/api/whoami');
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Detect programming language from file extension
   */
  detectLanguage(filePath) {
    const ext = path.extname(filePath).slice(1).toLowerCase();
    
    const languageMap = {
      'js': 'javascript',
      'jsx': 'javascript',
      'mjs': 'javascript',
      'cjs': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'pyw': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'cc': 'cpp',
      'cxx': 'cpp',
      'c++': 'cpp',
      'c': 'c',
      'h': 'c',
      'go': 'go',
      'rs': 'rust',
      'php': 'php',
      'rb': 'ruby',
      'swift': 'swift',
      'kt': 'kotlin',
      'kts': 'kotlin',
      'cs': 'csharp',
      'scala': 'scala',
      'r': 'r'
    };
    
    return languageMap[ext] || 'javascript';
  }

  /**
   * Handle API errors with user-friendly messages
   */
  handleError(error) {
    if (error.response) {
      // API returned an error response
      const status = error.response.status;
      const message = error.response.data?.error || error.message;
      
      if (status === 401) {
        throw new Error('Authentication failed. Your API key may be invalid or expired.\nRun: errors-ai login');
      } else if (status === 403) {
        throw new Error('Access denied. This feature requires a Pro or Team plan.\nUpgrade at: https://errors.ai/pricing');
      } else if (status === 429) {
        throw new Error('Rate limit exceeded. Please try again later or upgrade your plan.');
      } else if (status === 500) {
        throw new Error('Server error. Please try again later or contact support.');
      } else {
        throw new Error(`API error: ${message}`);
      }
    } else if (error.request) {
      // No response received
      throw new Error('Network error. Please check your internet connection and try again.');
    } else {
      // Other errors
      throw error;
    }
  }
}
