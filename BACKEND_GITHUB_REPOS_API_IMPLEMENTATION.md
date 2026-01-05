# Backend API Implementation: GitHub Repositories Fetching

## Overview
This document provides step-by-step instructions to implement the `/api/github/repos` API endpoint that fetches GitHub repositories using OAuth authentication tokens stored in the database.

## Endpoint Specification

### Endpoint
```
GET /api/github/repos
```

### Query Parameters
- `credentialName` (string, optional): Name of the credential that contains the OAuth token
- `connectorName` (string, optional): Name of the connector that contains the OAuth token
- `username` (string, required): GitHub username to fetch repositories for
- `accountId` (string, required): Account ID for context
- `enterpriseId` (string, required): Enterprise ID for context

**Note:** Either `credentialName` OR `connectorName` must be provided, but not both.

### Response Format
```json
[
  {
    "id": 123456789,
    "name": "repository-name",
    "full_name": "username/repository-name",
    "clone_url": "https://github.com/username/repository-name.git",
    "html_url": "https://github.com/username/repository-name",
    "description": "Repository description",
    "private": false,
    "fork": false,
    ...
  }
]
```

## Implementation Steps

### Step 1: Database Schema Verification

Ensure you have a table to store GitHub OAuth tokens. The schema should look like:

```sql
CREATE TABLE github_oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credential_name VARCHAR(255),
  connector_name VARCHAR(255),
  account_id UUID NOT NULL,
  enterprise_id UUID NOT NULL,
  access_token TEXT NOT NULL, -- Encrypted
  token_type VARCHAR(50) DEFAULT 'bearer',
  scope TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  UNIQUE(credential_name, account_id, enterprise_id),
  UNIQUE(connector_name, account_id, enterprise_id)
);

-- Indexes for faster lookups
CREATE INDEX idx_github_oauth_credential ON github_oauth_tokens(credential_name, account_id, enterprise_id);
CREATE INDEX idx_github_oauth_connector ON github_oauth_tokens(connector_name, account_id, enterprise_id);
```

### Step 2: Token Storage Function

Create a function to store OAuth tokens after successful OAuth flow:

```javascript
// utils/githubOAuthStorage.js
const crypto = require('crypto');

const ENCRYPTION_KEY = process.env.OAUTH_TOKEN_ENCRYPTION_KEY; // 32-byte key
const ALGORITHM = 'aes-256-gcm';

function encryptToken(token) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted: encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

function decryptToken(encryptedData) {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    Buffer.from(encryptedData.iv, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
  
  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

async function storeGitHubOAuthToken({
  credentialName,
  connectorName,
  accountId,
  enterpriseId,
  accessToken,
  tokenType = 'bearer',
  scope = 'repo',
  expiresAt = null
}) {
  const encrypted = encryptToken(accessToken);
  
  const query = `
    INSERT INTO github_oauth_tokens 
      (credential_name, connector_name, account_id, enterprise_id, access_token, token_type, scope, expires_at, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
    ON CONFLICT (credential_name, account_id, enterprise_id) 
    DO UPDATE SET
      access_token = $5,
      token_type = $6,
      scope = $7,
      expires_at = $8,
      updated_at = NOW()
    RETURNING id;
  `;
  
  const values = [
    credentialName || null,
    connectorName || null,
    accountId,
    enterpriseId,
    JSON.stringify(encrypted), // Store encrypted token as JSON
    tokenType,
    scope,
    expiresAt
  ];
  
  const result = await db.query(query, values);
  return result.rows[0];
}

async function getGitHubOAuthToken(credentialName, connectorName, accountId, enterpriseId) {
  let query;
  let values;
  
  if (credentialName) {
    query = `
      SELECT access_token, token_type, scope, expires_at
      FROM github_oauth_tokens
      WHERE credential_name = $1 
        AND account_id = $2 
        AND enterprise_id = $3
      LIMIT 1;
    `;
    values = [credentialName, accountId, enterpriseId];
  } else if (connectorName) {
    query = `
      SELECT access_token, token_type, scope, expires_at
      FROM github_oauth_tokens
      WHERE connector_name = $1 
        AND account_id = $2 
        AND enterprise_id = $3
      LIMIT 1;
    `;
    values = [connectorName, accountId, enterpriseId];
  } else {
    throw new Error('Either credentialName or connectorName must be provided');
  }
  
  const result = await db.query(query, values);
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const tokenData = result.rows[0];
  const encryptedData = JSON.parse(tokenData.access_token);
  const decryptedToken = decryptToken(encryptedData);
  
  return {
    accessToken: decryptedToken,
    tokenType: tokenData.token_type,
    scope: tokenData.scope,
    expiresAt: tokenData.expires_at
  };
}

module.exports = {
  storeGitHubOAuthToken,
  getGitHubOAuthToken,
  encryptToken,
  decryptToken
};
```

### Step 3: GitHub API Client Function

Create a function to fetch repositories from GitHub API:

```javascript
// utils/githubApiClient.js
const axios = require('axios');

async function fetchGitHubRepositories(username, accessToken, tokenType = 'bearer') {
  try {
    const url = `https://api.github.com/users/${username}/repos`;
    
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'YourApp/1.0'
    };
    
    // Add authorization header
    if (tokenType.toLowerCase() === 'bearer') {
      headers['Authorization'] = `Bearer ${accessToken}`;
    } else {
      headers['Authorization'] = `token ${accessToken}`;
    }
    
    const response = await axios.get(url, {
      headers: headers,
      params: {
        per_page: 100, // Maximum per page
        sort: 'updated',
        direction: 'desc'
      }
    });
    
    // Handle pagination if needed
    let allRepos = response.data;
    
    // Check if there are more pages
    const linkHeader = response.headers.link;
    if (linkHeader && linkHeader.includes('rel="next"')) {
      // Parse link header and fetch remaining pages
      // For simplicity, we'll fetch up to 3 pages (300 repos max)
      // You can implement full pagination if needed
      const pages = extractPagesFromLinkHeader(linkHeader);
      for (let page = 2; page <= Math.min(pages.total, 3); page++) {
        const pageResponse = await axios.get(url, {
          headers: headers,
          params: {
            per_page: 100,
            page: page,
            sort: 'updated',
            direction: 'desc'
          }
        });
        allRepos = allRepos.concat(pageResponse.data);
      }
    }
    
    return allRepos;
  } catch (error) {
    if (error.response) {
      // GitHub API error
      throw new Error(`GitHub API error: ${error.response.status} - ${error.response.statusText}`);
    } else if (error.request) {
      // Network error
      throw new Error('Network error: Could not reach GitHub API');
    } else {
      // Other error
      throw new Error(`Error fetching repositories: ${error.message}`);
    }
  }
}

function extractPagesFromLinkHeader(linkHeader) {
  const links = linkHeader.split(',');
  let total = 1;
  
  links.forEach(link => {
    const match = link.match(/page=(\d+)>; rel="last"/);
    if (match) {
      total = parseInt(match[1], 10);
    }
  });
  
  return { total };
}

module.exports = {
  fetchGitHubRepositories
};
```

### Step 4: API Endpoint Implementation

Implement the main API endpoint:

```javascript
// routes/api/github.js or routes/github.js
const express = require('express');
const router = express.Router();
const { getGitHubOAuthToken } = require('../../utils/githubOAuthStorage');
const { fetchGitHubRepositories } = require('../../utils/githubApiClient');

/**
 * GET /api/github/repos
 * Fetches GitHub repositories for a given username using OAuth authentication
 * 
 * Query Parameters:
 * - credentialName: Name of the credential (optional if connectorName provided)
 * - connectorName: Name of the connector (optional if credentialName provided)
 * - username: GitHub username (required)
 * - accountId: Account ID (required)
 * - enterpriseId: Enterprise ID (required)
 */
router.get('/repos', async (req, res) => {
  try {
    const { credentialName, connectorName, username, accountId, enterpriseId } = req.query;
    
    // Validate required parameters
    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'username parameter is required'
      });
    }
    
    if (!accountId || !enterpriseId) {
      return res.status(400).json({
        success: false,
        message: 'accountId and enterpriseId parameters are required'
      });
    }
    
    // Validate that either credentialName or connectorName is provided
    if (!credentialName && !connectorName) {
      return res.status(400).json({
        success: false,
        message: 'Either credentialName or connectorName must be provided'
      });
    }
    
    if (credentialName && connectorName) {
      return res.status(400).json({
        success: false,
        message: 'Cannot provide both credentialName and connectorName. Provide only one.'
      });
    }
    
    // Validate username format (basic validation)
    if (!/^[a-zA-Z0-9]([a-zA-Z0-9]|-(?![.-])){0,38}$/.test(username)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid GitHub username format'
      });
    }
    
    console.log(`[GitHub Repos API] Fetching repos for username: ${username}`);
    console.log(`[GitHub Repos API] Using ${credentialName ? 'credential' : 'connector'}: ${credentialName || connectorName}`);
    
    // Retrieve OAuth token from database
    let oauthToken;
    try {
      oauthToken = await getGitHubOAuthToken(credentialName, connectorName, accountId, enterpriseId);
    } catch (error) {
      console.error('[GitHub Repos API] Error retrieving OAuth token:', error);
      return res.status(500).json({
        success: false,
        message: 'Error retrieving OAuth token from database',
        error: error.message
      });
    }
    
    if (!oauthToken) {
      return res.status(404).json({
        success: false,
        message: `OAuth token not found for ${credentialName ? 'credential' : 'connector'}: ${credentialName || connectorName}`,
        hint: 'Make sure OAuth authentication has been completed for this credential/connector'
      });
    }
    
    // Check if token is expired
    if (oauthToken.expiresAt && new Date(oauthToken.expiresAt) < new Date()) {
      return res.status(401).json({
        success: false,
        message: 'OAuth token has expired. Please re-authenticate.',
        expiresAt: oauthToken.expiresAt
      });
    }
    
    console.log(`[GitHub Repos API] OAuth token retrieved successfully`);
    
    // Fetch repositories from GitHub API
    let repositories;
    try {
      repositories = await fetchGitHubRepositories(
        username,
        oauthToken.accessToken,
        oauthToken.tokenType
      );
      console.log(`[GitHub Repos API] Successfully fetched ${repositories.length} repositories`);
    } catch (error) {
      console.error('[GitHub Repos API] Error fetching repositories from GitHub:', error);
      
      // Handle specific GitHub API errors
      if (error.message.includes('401') || error.message.includes('403')) {
        return res.status(401).json({
          success: false,
          message: 'GitHub API authentication failed. Token may be invalid or expired.',
          error: error.message
        });
      }
      
      if (error.message.includes('404')) {
        return res.status(404).json({
          success: false,
          message: `GitHub user "${username}" not found`,
          error: error.message
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Error fetching repositories from GitHub API',
        error: error.message
      });
    }
    
    // Return repositories
    res.json(repositories);
    
  } catch (error) {
    console.error('[GitHub Repos API] Unexpected error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;
```

### Step 5: Register the Route

Register the route in your main application file:

```javascript
// app.js or server.js
const githubRoutes = require('./routes/api/github');

// Register routes
app.use('/api/github', githubRoutes);
```

### Step 6: Environment Variables

Add the following to your `.env` file:

```env
# OAuth Token Encryption Key (32-byte hex string)
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
OAUTH_TOKEN_ENCRYPTION_KEY=your-32-byte-hex-encryption-key-here
```

### Step 7: Update OAuth Callback Handler

Update your OAuth callback handler to store tokens using the new function:

```javascript
// routes/oauth-token.js or wherever you handle OAuth callback
const { storeGitHubOAuthToken } = require('../utils/githubOAuthStorage');

app.post('/api/oauth-token', async (req, res) => {
  try {
    const { code, credentialName, connectorName, accountId, enterpriseId } = req.body;
    
    // ... existing code to exchange code for token ...
    
    // After successful token exchange:
    if (response && response.access_token) {
      // Store the token
      await storeGitHubOAuthToken({
        credentialName: credentialName || null,
        connectorName: connectorName || null,
        accountId: accountId,
        enterpriseId: enterpriseId,
        accessToken: response.access_token,
        tokenType: response.token_type || 'bearer',
        scope: response.scope || 'repo',
        expiresAt: null // GitHub tokens don't expire by default, but you can set if provided
      });
      
      res.json({
        success: true,
        message: 'OAuth token stored successfully'
      });
    }
  } catch (error) {
    // ... error handling ...
  }
});
```

## Testing

### Test Cases

1. **Valid Request with Credential Name**
```bash
curl "http://localhost:3000/api/github/repos?credentialName=Github_Account_Fin_Cred&username=Vipin-Gup&accountId=243c7cd0-4e7b-4da0-a570-8922a7837e4a&enterpriseId=a248a56f-c187-438b-97f8-955030f4bbe3"
```

2. **Valid Request with Connector Name**
```bash
curl "http://localhost:3000/api/github/repos?connectorName=GitHub_Account_Fin_Conn&username=Vipin-Gup&accountId=243c7cd0-4e7b-4da0-a570-8922a7837e4a&enterpriseId=a248a56f-c187-438b-97f8-955030f4bbe3"
```

3. **Missing Username (Should return 400)**
```bash
curl "http://localhost:3000/api/github/repos?credentialName=Github_Account_Fin_Cred&accountId=243c7cd0-4e7b-4da0-a570-8922a7837e4a&enterpriseId=a248a56f-c187-438b-97f8-955030f4bbe3"
```

4. **Missing Credential/Connector Name (Should return 400)**
```bash
curl "http://localhost:3000/api/github/repos?username=Vipin-Gup&accountId=243c7cd0-4e7b-4da0-a570-8922a7837e4a&enterpriseId=a248a56f-c187-438b-97f8-955030f4bbe3"
```

5. **Invalid Username Format (Should return 400)**
```bash
curl "http://localhost:3000/api/github/repos?credentialName=Github_Account_Fin_Cred&username=invalid-username-!!!&accountId=243c7cd0-4e7b-4da0-a570-8922a7837e4a&enterpriseId=a248a56f-c187-438b-97f8-955030f4bbe3"
```

6. **Non-existent Credential (Should return 404)**
```bash
curl "http://localhost:3000/api/github/repos?credentialName=NonExistentCred&username=Vipin-Gup&accountId=243c7cd0-4e7b-4da0-a570-8922a7837e4a&enterpriseId=a248a56f-c187-438b-97f8-955030f4bbe3"
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "username parameter is required"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "OAuth token has expired. Please re-authenticate.",
  "expiresAt": "2024-01-01T00:00:00Z"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "OAuth token not found for credential: Github_Account_Fin_Cred",
  "hint": "Make sure OAuth authentication has been completed for this credential/connector"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Error fetching repositories from GitHub API",
  "error": "GitHub API error: 401 - Unauthorized"
}
```

## Security Considerations

1. **Token Encryption**: Always encrypt OAuth tokens before storing in the database
2. **HTTPS Only**: Ensure all API calls use HTTPS in production
3. **Rate Limiting**: Implement rate limiting to prevent abuse
4. **Input Validation**: Validate all input parameters to prevent injection attacks
5. **Token Expiration**: Check token expiration before making API calls
6. **Error Messages**: Don't expose sensitive information in error messages

## Dependencies

```json
{
  "dependencies": {
    "axios": "^1.6.0",
    "crypto": "^1.0.1"
  }
}
```

## Notes

- The endpoint supports pagination but limits to 3 pages (300 repos) by default. You can extend this if needed.
- GitHub API rate limits: 5,000 requests per hour for authenticated requests
- The `clone_url` field is included in the response, which is what the frontend expects
- Tokens are stored encrypted in the database for security
- The endpoint handles both credential-based and connector-based OAuth tokens

## Integration with Frontend

The frontend expects the response to be an array of repository objects with at least the `clone_url` field:

```javascript
// Frontend usage
const response = await api.get(`/api/github/repos?credentialName=${credentialName}&username=${username}&accountId=${accountId}&enterpriseId=${enterpriseId}`);
const repos = response.map(repo => repo.clone_url).filter(Boolean);
```

Make sure your response includes the `clone_url` field for each repository.

