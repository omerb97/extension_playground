// Demo: Vulnerable Application with Hardcoded Secrets
// This file demonstrates common security vulnerabilities that the Secret Scanner extension should detect

// Load environment variables from .env file
require('dotenv').config();

// 1. Database Configuration with Hardcoded Credentials
const dbConfig = {
    host: 'localhost',
    port: 5432,
    user: 'admin',
    password: 'SuperSecret123!',  // ⚠️ Should be flagged: Hardcoded password
    database: 'production_db'
};

// 2. API Keys for Third-Party Services
const stripeApiKey = "sk_live_1234567890abcdef1234567890abcdef";  // ⚠️ Should be flagged: API key
const googleApiKey = "AIzaSyDXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";      // ⚠️ Should be flagged: API key

// 3. AWS Credentials
const awsConfig = {
    accessKeyId: "AKIAIOSFODNN7EXAMPLE",                          // ⚠️ Should be flagged: AWS access key
    secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY", // ⚠️ Should be flagged: AWS secret
    region: 'us-west-2'
};

// 4. MongoDB Connection String
const mongoConnectionString = "mongodb://dbuser:myRealPassword@cluster0.mongodb.net/myapp"; // ⚠️ Should be flagged: Database URL

// 5. JWT Secret Key
const jwtSecret = "my-super-secret-jwt-signing-key-2023";  // ⚠️ Should be flagged: Secret token

// 6. GitHub Personal Access Token
const githubToken = "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";  // ⚠️ Should be flagged: GitHub token

// 7. Authentication Headers
function makeApiCall() {
    const headers = {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',  // ⚠️ Should be flagged: Bearer token + JWT
        'X-API-Key': 'api_1234567890abcdef1234567890abcdef'  // ⚠️ Should be flagged: API key
    };
    
    return fetch('https://api.example.com/data', { headers });
}

// 8. Email Service Configuration
const emailConfig = {
    service: 'gmail',
    auth: {
        user: 'myapp@gmail.com',
        pass: 'MyEmailPassword456'  // ⚠️ Should be flagged: Password
    }
};

// 9. SSH Private Key (beginning)
const sshKey = `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA1234567890...`;  // ⚠️ Should be flagged: Private key

// 10. Slack Webhook URL with token
const slackWebhook = "https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX";

// 11. Discord Bot Token
const discordToken = "ODxxxxxxxxxxxxxxxxxxxxxxxx.YyyYYY.ZzzZZZZZZZZZZZZZZZZZZZZZZZ";

// Examples that should NOT be flagged (contain example/placeholder keywords):
const exampleApiKey = "your_api_key_here";           // Should NOT be flagged
const placeholderPassword = "placeholder_password";   // Should NOT be flagged
// TODO: Replace with actual API key                  // Should NOT be flagged
const yourSecretKey = "YOUR_SECRET_KEY";              // Should NOT be flagged

console.log('Vulnerable app started with hardcoded secrets!');
