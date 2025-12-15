# Backend OAuth 2.0 Implementation Guide

This document provides clear steps to implement the GitHub OAuth 2.0 flow in your backend application.

## Overview

The OAuth flow consists of:
1. Frontend redirects user to GitHub for authorization
2. GitHub redirects back with authorization code
3. Backend exchanges code for access token
4. Backend stores access token securely

## Step 1: Environment Variables

Add these environment variables to your backend `.env` file:

```env
GITHUB_CLIENT_ID=your_github_oauth_app_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_app_client_secret
```

**Important:** Never commit these values to version control. Store them securely as environment variables.

## Step 2: Create API Endpoint to Get Client ID

**⚠️ CRITICAL: This endpoint MUST be implemented for the OAuth flow to work!**

**Endpoint:** `GET /api/oauth/github/client-id`

**Query Parameters:**
- `accountId` (optional)
- `accountName` (optional)
- `enterpriseId` (optional)
- `enterpriseName` (optional)
- `workstream` (optional)

**Response (Success):**
```json
{
  "clientId": "your_github_oauth_app_client_id"
}
```

**Response (Error):**
```json
{
  "error": "GitHub OAuth Client ID is not configured"
}
```

**Implementation Example (Node.js/Express):**
```javascript
app.get('/api/oauth/github/client-id', (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  
  if (!clientId) {
    return res.status(500).json({ 
      error: 'GitHub OAuth Client ID is not configured' 
    });
  }
  
  res.json({ clientId });
});
```

**Implementation Example (NestJS):**
```typescript
import { Controller, Get, Query } from '@nestjs/common';

@Controller('api/oauth/github')
export class GitHubOAuthController {
  @Get('client-id')
  getClientId(@Query() query: any) {
    const clientId = process.env.GITHUB_CLIENT_ID;
    
    if (!clientId) {
      return {
        error: 'GitHub OAuth Client ID is not configured'
      };
    }
    
    return { clientId };
  }
}
```

**⚠️ IMPORTANT NOTES:**
- This endpoint is called by the frontend when the OAuth modal opens
- The endpoint MUST return the Client ID in the format: `{ "clientId": "..." }`
- The Client ID should come from your environment variables (never hardcode it)
- Make sure `GITHUB_CLIENT_ID` is set in your backend `.env` file

## Step 3: Create API Endpoint for Token Exchange

**Endpoint:** `POST /api/oauth-token`

**Request Body:**
```json
{
  "code": "authorization_code_from_github"
}
```

**Response (Success):**
```json
{
  "success": true,
  "accessToken": "github_access_token",
  "tokenType": "bearer",
  "scope": "repo"
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Error message describing what went wrong"
}
```

## Step 4: Implement Token Exchange Logic

**Implementation Example (Node.js/Express with axios):**

```javascript
const axios = require('axios');

app.post('/api/oauth-token', async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Authorization code is required'
      });
    }
    
    // Exchange code for access token with GitHub
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: code,
        redirect_uri: `${process.env.APP_BASE_URL || 'http://localhost:3000'}/security-governance/credentials/github/oauth2/callback`
      },
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );
    
    const { access_token, token_type, scope, error, error_description } = tokenResponse.data;
    
    if (error) {
      console.error('GitHub OAuth error:', error, error_description);
      return res.status(400).json({
        success: false,
        message: error_description || error || 'Failed to exchange authorization code'
      });
    }
    
    if (!access_token) {
      return res.status(400).json({
        success: false,
        message: 'No access token received from GitHub'
      });
    }
    
    // TODO: Store the access token securely in your database
    // Associate it with the user/account/enterprise context
    // Example:
    // await storeGitHubAccessToken({
    //   userId: req.user.id,
    //   accountId: req.query.accountId,
    //   enterpriseId: req.query.enterpriseId,
    //   accessToken: access_token,
    //   tokenType: token_type,
    //   scope: scope
    // });
    
    // Return success response
    res.json({
      success: true,
      accessToken: access_token,
      tokenType: token_type || 'bearer',
      scope: scope || 'repo'
    });
    
  } catch (error) {
    console.error('Token exchange error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to exchange authorization code'
    });
  }
});
```

## Step 5: Store Access Token Securely

**Important:** Store the access token securely in your database. Do NOT return it to the frontend after initial exchange.

**Database Schema Example:**
```sql
CREATE TABLE github_oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  account_id UUID REFERENCES accounts(id),
  enterprise_id UUID REFERENCES enterprises(id),
  access_token TEXT NOT NULL, -- Encrypt this field
  token_type VARCHAR(50) DEFAULT 'bearer',
  scope TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP, -- If GitHub provides expiration
  UNIQUE(user_id, account_id, enterprise_id)
);
```

**Implementation Example:**
```javascript
async function storeGitHubAccessToken({ userId, accountId, enterpriseId, accessToken, tokenType, scope }) {
  // Encrypt the access token before storing
  const encryptedToken = encrypt(accessToken);
  
  // Store in database
  await db.query(
    `INSERT INTO github_oauth_tokens 
     (user_id, account_id, enterprise_id, access_token, token_type, scope, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())
     ON CONFLICT (user_id, account_id, enterprise_id) 
     DO UPDATE SET 
       access_token = $4,
       token_type = $5,
       scope = $6,
       updated_at = NOW()`,
    [userId, accountId, enterpriseId, encryptedToken, tokenType, scope]
  );
}
```

## Step 6: Use Access Token for GitHub API Calls

**Example: Making GitHub API requests with stored token**

```javascript
async function getGitHubRepositories(userId, accountId, enterpriseId) {
  // Retrieve stored access token
  const tokenRecord = await db.query(
    `SELECT access_token FROM github_oauth_tokens 
     WHERE user_id = $1 AND account_id = $2 AND enterprise_id = $3`,
    [userId, accountId, enterpriseId]
  );
  
  if (!tokenRecord.rows.length) {
    throw new Error('GitHub access token not found');
  }
  
  // Decrypt the token
  const accessToken = decrypt(tokenRecord.rows[0].access_token);
  
  // Make GitHub API request
  const response = await axios.get('https://api.github.com/user/repos', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });
  
  return response.data;
}
```

## Step 7: Handle Token Refresh (Optional)

GitHub access tokens don't expire by default, but you should implement token refresh logic if you're using expiring tokens:

```javascript
async function refreshGitHubToken(userId, accountId, enterpriseId) {
  // Check if token is expired
  const tokenRecord = await db.query(
    `SELECT access_token, expires_at FROM github_oauth_tokens 
     WHERE user_id = $1 AND account_id = $2 AND enterprise_id = $3`,
    [userId, accountId, enterpriseId]
  );
  
  if (!tokenRecord.rows.length) {
    throw new Error('GitHub access token not found');
  }
  
  const { expires_at } = tokenRecord.rows[0];
  
  if (expires_at && new Date(expires_at) < new Date()) {
    // Token expired, require user to re-authenticate
    throw new Error('GitHub access token expired. Please re-authenticate.');
  }
  
  // Token is still valid
  return decrypt(tokenRecord.rows[0].access_token);
}
```

## Security Best Practices

1. **Never expose Client Secret:** Keep `GITHUB_CLIENT_SECRET` only on the backend
2. **Encrypt stored tokens:** Always encrypt access tokens before storing in database
3. **Use HTTPS:** Always use HTTPS in production
4. **Validate redirect_uri:** Ensure the redirect URI matches your registered OAuth app
5. **One-time use:** Authorization codes should only be used once
6. **Token rotation:** Consider implementing token rotation for enhanced security

## Testing

1. Test the `/api/oauth/github/client-id` endpoint returns the client ID
2. Test the `/api/oauth-token` endpoint with a valid authorization code
3. Test error handling for invalid codes
4. Test token storage and retrieval
5. Test GitHub API calls with stored tokens

## Error Handling

Handle these common errors:
- Invalid authorization code
- Expired authorization code
- Network errors when calling GitHub API
- Missing environment variables
- Database errors when storing tokens

## Notes

- The authorization code from GitHub is single-use and expires quickly (usually within 10 minutes)
- Store the access token securely and associate it with the appropriate user/account/enterprise context
- Do not perform the code-token exchange multiple times for the same authorization code
- The access token can be used to make GitHub API requests on behalf of the user

