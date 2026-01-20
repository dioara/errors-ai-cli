import fs from 'fs';
import path from 'path';
import os from 'os';

const CREDENTIALS_DIR = path.join(os.homedir(), '.errors-ai');
const CREDENTIALS_FILE = path.join(CREDENTIALS_DIR, 'credentials.json');

/**
 * Save API credentials to disk
 */
export function saveCredentials(apiKey, email) {
  // Create directory if it doesn't exist
  if (!fs.existsSync(CREDENTIALS_DIR)) {
    fs.mkdirSync(CREDENTIALS_DIR, { recursive: true });
  }
  
  const credentials = {
    apiKey,
    email,
    createdAt: new Date().toISOString(),
    expiresAt: null
  };
  
  // Write with restricted permissions (read/write for owner only)
  fs.writeFileSync(
    CREDENTIALS_FILE,
    JSON.stringify(credentials, null, 2),
    { mode: 0o600 }
  );
}

/**
 * Load API credentials from disk
 */
export function loadCredentials() {
  if (!fs.existsSync(CREDENTIALS_FILE)) {
    return null;
  }
  
  try {
    const data = fs.readFileSync(CREDENTIALS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load credentials:', error.message);
    return null;
  }
}

/**
 * Delete stored credentials
 */
export function deleteCredentials() {
  if (fs.existsSync(CREDENTIALS_FILE)) {
    fs.unlinkSync(CREDENTIALS_FILE);
  }
}

/**
 * Check if credentials exist
 */
export function hasCredentials() {
  return fs.existsSync(CREDENTIALS_FILE);
}

/**
 * Get credentials directory path
 */
export function getCredentialsDir() {
  return CREDENTIALS_DIR;
}

/**
 * Get credentials file path
 */
export function getCredentialsFile() {
  return CREDENTIALS_FILE;
}
