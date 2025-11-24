import { SecretPattern } from '../models/SecretPattern';

export const SECRET_PATTERNS: SecretPattern[] = [
    // API Keys
    {
        name: 'API Key',
        regex: /(?:api[_-]?key|apikey|key)\s*[=:]\s*['"]\s*[a-zA-Z0-9_\-]{16,}['"]/gi,
        description: 'Potential API key detected'
    },
    {
        name: 'Bearer Token',
        regex: /bearer\s+[a-zA-Z0-9_\-\.=]{20,}/gi,
        description: 'Bearer token detected'
    },
    // Passwords
    {
        name: 'Password',
        regex: /(?:password|passwd|pwd)\s*[=:]\s*['"]\s*[^\s'"]{6,}['"]/gi,
        description: 'Hardcoded password detected'
    },
    // Database credentials
    {
        name: 'Database URL',
        regex: /(?:mongodb|mysql|postgres|postgresql):\/\/[^:]+:[^@]+@[^\/\s]+/gi,
        description: 'Database connection string with credentials detected'
    },
    // AWS Keys
    {
        name: 'AWS Access Key',
        regex: /AKIA[0-9A-Z]{16}/g,
        description: 'AWS access key detected'
    },
    {
        name: 'AWS Secret Key',
        regex: /aws[_-]?secret[_-]?access[_-]?key\s*[=:]\s*['"]\s*[a-zA-Z0-9+\/]{40}['"]/gi,
        description: 'AWS secret access key detected'
    },
    // Generic secrets
    {
        name: 'Secret',
        regex: /(?:secret|token)\s*[=:]\s*['"]\s*[a-zA-Z0-9_\-]{12,}['"]/gi,
        description: 'Potential secret token detected'
    },
    // Private keys
    {
        name: 'Private Key',
        regex: /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----/gi,
        description: 'Private key detected'
    },
    // JWT tokens
    {
        name: 'JWT Token',
        regex: /eyJ[a-zA-Z0-9_\-]*\.eyJ[a-zA-Z0-9_\-]*\.[a-zA-Z0-9_\-]*/g,
        description: 'JWT token detected'
    },
    // GitHub tokens
    {
        name: 'GitHub Token',
        regex: /gh[pousr]_[A-Za-z0-9_]{36}/g,
        description: 'GitHub token detected'
    }
];
