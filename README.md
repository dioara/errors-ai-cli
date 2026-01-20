# Errors.AI CLI

AI-powered code analysis CLI for finding bugs and security vulnerabilities in your code.

## Installation

```bash
npm install -g @lampstand/errors-ai-cli
```

## Quick Start

```bash
# Authenticate
errors-ai login

# Analyze your code
errors-ai analyze src/

# Use in CI/CD
errors-ai check src/ --fail-on high
```

## Features

- ✅ **Browser-based authentication** - Secure OAuth-like flow
- ✅ **Universal language support** - Works with ALL programming languages
- ✅ **Multiple output formats** - Text, JSON, GitHub Actions annotations
- ✅ **CI/CD ready** - Exit codes and machine-readable output
- ✅ **Project configuration** - `.errors-ai.yml` for team settings
- ✅ **Offline credentials** - Stored securely in `~/.errors-ai/`

## Commands

### Authentication

#### `errors-ai login`

Authenticate with Errors.AI via browser flow.

```bash
# Interactive browser login
errors-ai login

# Manual API key
errors-ai login --api-key sk_live_xxx

# Don't open browser automatically
errors-ai login --no-browser
```

#### `errors-ai logout`

Remove stored credentials.

```bash
errors-ai logout
```

#### `errors-ai whoami`

Show current authenticated user.

```bash
errors-ai whoami
```

### Code Analysis

#### `errors-ai analyze <path>`

Analyze code and display results.

```bash
# Analyze single file
errors-ai analyze src/index.js

# Analyze directory
errors-ai analyze src/

# Security analysis
errors-ai analyze --type security src/

# JSON output
errors-ai analyze src/ --format json --output report.json

# Save to web dashboard
errors-ai analyze src/ --save-history

# Exclude patterns
errors-ai analyze src/ --exclude "*.test.js" --exclude "*.spec.js"
```

**Options:**
- `--type <type>` - Analysis type: `code_errors` (default) or `security_analysis`
- `--format <format>` - Output format: `text` (default), `json`, or `github-actions`
- `--output <file>` - Save output to file
- `--save-history` - Save analysis to web dashboard
- `--language <lang>` - Force language detection
- `--exclude <pattern>` - Exclude files matching pattern

#### `errors-ai check <path>`

Analyze code and exit with error code (for CI/CD).

```bash
# Fail on high severity or above
errors-ai check src/

# Fail on medium severity or above
errors-ai check src/ --fail-on medium

# GitHub Actions format
errors-ai check src/ --format github-actions
```

**Options:**
- `--fail-on <severity>` - Exit with error if issues of this severity or higher (default: `high`)
  - Values: `critical`, `high`, `medium`, `low`
- `--format <format>` - Output format: `text` or `github-actions`
- `--exclude <pattern>` - Exclude files matching pattern

**Exit Codes:**
- `0` - No issues found (or below threshold)
- `1` - Issues found at or above threshold
- `2` - Authentication error
- `3` - API error
- `4` - Invalid arguments

### Configuration

#### `errors-ai init`

Create `.errors-ai.yml` configuration file.

```bash
# Interactive setup
errors-ai init

# Overwrite existing config
errors-ai init --force
```

### Utility

#### `errors-ai version`

Show CLI version.

```bash
errors-ai version
```

## Configuration File

Create a `.errors-ai.yml` file in your project root:

```yaml
# Analysis type: code_errors | security_analysis
analysis_type: code_errors

# Exclude patterns (glob format)
exclude:
  - node_modules/
  - dist/
  - build/
  - "*.test.js"
  - "*.spec.js"

# Severity threshold for CI/CD
severity_threshold: high

# Output format: text | json | github-actions
output_format: text

# Save analyses to web dashboard
save_history: false
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Code Analysis

on: [push, pull_request]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install Errors.AI CLI
        run: npm install -g @lampstand/errors-ai-cli
      
      - name: Authenticate
        run: errors-ai login --api-key ${{ secrets.ERRORS_AI_API_KEY }}
      
      - name: Analyze Code
        run: errors-ai check src/ --fail-on high --format github-actions
```

### GitLab CI

```yaml
code_analysis:
  stage: test
  script:
    - npm install -g @lampstand/errors-ai-cli
    - errors-ai login --api-key $ERRORS_AI_API_KEY
    - errors-ai check src/ --fail-on high
```

### Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

errors-ai check $(git diff --cached --name-only --diff-filter=ACM) --fail-on medium

if [ $? -ne 0 ]; then
  echo "❌ Errors.AI found issues. Commit aborted."
  exit 1
fi
```

## Supported Languages

**ALL programming languages are supported!** The AI analyzes any code you provide.

Commonly used languages include:
- JavaScript, TypeScript, Python, Java, C/C++, Go, Rust
- PHP, Ruby, Swift, Kotlin, C#, Scala, R, Dart, Elixir
- And literally any other programming language you can think of

## Output Formats

### Text (Human-Readable)

```
🔍 Analyzing: src/index.js

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ HIGH SEVERITY (2 issues)

  Line 12: Undefined variable 'user'
  │ const name = user.name;
  │              ^^^^
  │ Variable 'user' is not defined in this scope.
  │ 
  │ 💡 Suggestion: Define 'user' before using it

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Summary: 10 issues found (2 high, 5 medium, 3 low)
```

### JSON (Machine-Readable)

```json
{
  "file": "src/index.js",
  "language": "javascript",
  "errors": [...],
  "summary": {
    "total": 10,
    "high": 2,
    "medium": 5,
    "low": 3
  }
}
```

### GitHub Actions (Annotations)

```
::error file=src/index.js,line=12,col=14::Undefined variable 'user'
::warning file=src/index.js,line=23,col=7::Unused variable 'count'
```

## Authentication

The CLI uses a secure browser-based authentication flow:

1. Run `errors-ai login`
2. Browser opens to https://errors.ai/cli/auth
3. Authorize the CLI
4. API key is saved to `~/.errors-ai/credentials.json`

For CI/CD environments, use manual API key authentication:

```bash
errors-ai login --api-key sk_live_xxx
```

Get your API key from: https://errors.ai/settings/api-keys

## Credentials Storage

Credentials are stored in:
- **Location:** `~/.errors-ai/credentials.json`
- **Permissions:** Read/write for owner only (0600)
- **Format:** JSON with API key and email

## Troubleshooting

### "Not authenticated" error

```bash
errors-ai login
```

### "Rate limit exceeded" error

Upgrade your plan at https://errors.ai/pricing or wait for the rate limit to reset.

### "Network error"

Check your internet connection and try again.

### Browser doesn't open during login

Use the `--no-browser` flag and manually visit the URL:

```bash
errors-ai login --no-browser
```

## Support

- **Documentation:** https://docs.errors.ai
- **Website:** https://errors.ai
- **Issues:** https://github.com/dioara/errors-ai-cli/issues
- **Email:** support@errors.ai

## License

MIT License - see LICENSE file for details.
