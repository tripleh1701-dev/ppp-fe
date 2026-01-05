# Backend API Implementation: GitHub Branches Fetching

## Overview
This document provides step-by-step instructions to implement the `/api/github/branches` API endpoint that fetches GitHub repository branches using OAuth authentication tokens stored in the database.

## Endpoint Specification

### Endpoint
```
GET /api/github/branches
```

### Query Parameters
- `credentialName` (string, optional): Name of the credential that contains the OAuth token
- `connectorName` (string, optional): Name of the connector that contains the OAuth token
- `owner` (string, required): GitHub repository owner (username or organization name)
- `repo` (string, required): GitHub repository name
- `accountId` (string, required): Account ID for context
- `enterpriseId` (string, required): Enterprise ID for context

**Note:** Either `credentialName` OR `connectorName` must be provided, but not both.

### Response Format
```json
[
  {
    "name": "main",
    "commit": {
      "sha": "f716595fa7c7c8d31b66a6dffe0e7ebc71af715f",
      "url": "https://api.github.com/repos/Vipin-Gup/ppp-fe/commits/f716595fa7c7c8d31b66a6dffe0e7ebc71af715f"
    },
    "protected": false
  },
  {
    "name": "main-bkp",
    "commit": {
      "sha": "d1952ec3c08b96df7166b5840584d32df6aab24e",
      "url": "https://api.github.com/repos/Vipin-Gup/ppp-fe/commits/d1952ec3c08b96df7166b5840584d32df6aab24e"
    },
    "protected": false
  }
]
```

**Important:** The frontend expects the `name` field from each branch object in the response.

## Implementation Steps

### Step 1: Reuse Existing Token Storage

This endpoint uses the same OAuth token storage mechanism as the `/api/github/repos` endpoint. Refer to `BACKEND_GITHUB_REPOS_API_IMPLEMENTATION.md` for:
- Database schema (`github_oauth_tokens` table)
- Token storage functions (`storeGitHubOAuthToken`, `getGitHubOAuthToken`)
- Token encryption/decryption utilities

### Step 2: GitHub API Client Function

Create or update the GitHub API client function to fetch branches:

```javascript
// utils/githubApiClient.js
const axios = require('axios');

async function fetchGitHubBranches(owner, repo, accessToken, tokenType = 'bearer') {
  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/branches`;
    
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
    let allBranches = response.data;
    
    // Check if there are more pages
    const linkHeader = response.headers.link;
    if (linkHeader && linkHeader.includes('rel="next"')) {
      // Parse link header and fetch remaining pages
      // For simplicity, we'll fetch up to 3 pages (300 branches max)
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
        allBranches = allBranches.concat(pageResponse.data);
      }
    }
    
    return allBranches;
  } catch (error) {
    if (error.response) {
      // GitHub API error
      throw new Error(`GitHub API error: ${error.response.status} - ${error.response.statusText}`);
    } else if (error.request) {
      // Network error
      throw new Error('Network error: Could not reach GitHub API');
    } else {
      // Other error
      throw new Error(`Error fetching branches: ${error.message}`);
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
  fetchGitHubBranches,
  fetchGitHubRepositories // Keep existing function
};
```

### Step 3: API Endpoint Implementation

Implement the main API endpoint:

```javascript
// routes/api/github.js or routes/github.js
const express = require('express');
const router = express.Router();
const { getGitHubOAuthToken } = require('../../utils/githubOAuthStorage');
const { fetchGitHubBranches } = require('../../utils/githubApiClient');

/**
 * GET /api/github/branches
 * Fetches GitHub repository branches for a given owner/repo using OAuth authentication
 * 
 * Query Parameters:
 * - credentialName: Name of the credential (optional if connectorName provided)
 * - connectorName: Name of the connector (optional if credentialName provided)
 * - owner: GitHub repository owner (required)
 * - repo: GitHub repository name (required)
 * - accountId: Account ID (required)
 * - enterpriseId: Enterprise ID (required)
 */
router.get('/branches', async (req, res) => {
  try {
    const { credentialName, connectorName, owner, repo, accountId, enterpriseId } = req.query;
    
    // Validate required parameters
    if (!owner || !repo) {
      return res.status(400).json({
        success: false,
        message: 'owner and repo parameters are required'
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
    
    // Validate owner and repo format (basic validation)
    if (!/^[a-zA-Z0-9]([a-zA-Z0-9]|-(?![.-])){0,38}$/.test(owner)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid GitHub owner format'
      });
    }
    
    if (!/^[a-zA-Z0-9]([a-zA-Z0-9]|-(?![.-])){0,100}$/.test(repo)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid GitHub repository name format'
      });
    }
    
    console.log(`[GitHub Branches API] Fetching branches for owner: ${owner}, repo: ${repo}`);
    console.log(`[GitHub Branches API] Using ${credentialName ? 'credential' : 'connector'}: ${credentialName || connectorName}`);
    
    // Retrieve OAuth token from database
    let oauthToken;
    try {
      oauthToken = await getGitHubOAuthToken(credentialName, connectorName, accountId, enterpriseId);
    } catch (error) {
      console.error('[GitHub Branches API] Error retrieving OAuth token:', error);
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
    
    console.log(`[GitHub Branches API] OAuth token retrieved successfully`);
    
    // Fetch branches from GitHub API
    let branches;
    try {
      branches = await fetchGitHubBranches(
        owner,
        repo,
        oauthToken.accessToken,
        oauthToken.tokenType
      );
      console.log(`[GitHub Branches API] Successfully fetched ${branches.length} branches`);
    } catch (error) {
      console.error('[GitHub Branches API] Error fetching branches from GitHub:', error);
      
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
          message: `GitHub repository "${owner}/${repo}" not found or not accessible`,
          error: error.message
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Error fetching branches from GitHub API',
        error: error.message
      });
    }
    
    // Return branches (frontend expects array with 'name' field)
    res.json(branches);
    
  } catch (error) {
    console.error('[GitHub Branches API] Unexpected error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;
```

### Step 4: Register the Route

If not already registered, add the route to your main application file:

```javascript
// app.js or server.js
const githubRoutes = require('./routes/api/github');

// Register routes (if not already done)
app.use('/api/github', githubRoutes);
```

## Testing

### Test Cases

1. **Valid Request with Credential Name**
```bash
curl "http://localhost:3000/api/github/branches?credentialName=Github_Account_Fin_Cred&owner=Vipin-Gup&repo=ppp-fe&accountId=243c7cd0-4e7b-4da0-a570-8922a7837e4a&enterpriseId=a248a56f-c187-438b-97f8-955030f4bbe3"
```

2. **Valid Request with Connector Name**
```bash
curl "http://localhost:3000/api/github/branches?connectorName=GitHub_Account_Fin_Conn&owner=Vipin-Gup&repo=ppp-fe&accountId=243c7cd0-4e7b-4da0-a570-8922a7837e4a&enterpriseId=a248a56f-c187-438b-97f8-955030f4bbe3"
```

3. **Missing Owner (Should return 400)**
```bash
curl "http://localhost:3000/api/github/branches?credentialName=Github_Account_Fin_Cred&repo=ppp-fe&accountId=243c7cd0-4e7b-4da0-a570-8922a7837e4a&enterpriseId=a248a56f-c187-438b-97f8-955030f4bbe3"
```

4. **Missing Repo (Should return 400)**
```bash
curl "http://localhost:3000/api/github/branches?credentialName=Github_Account_Fin_Cred&owner=Vipin-Gup&accountId=243c7cd0-4e7b-4da0-a570-8922a7837e4a&enterpriseId=a248a56f-c187-438b-97f8-955030f4bbe3"
```

5. **Missing Credential/Connector Name (Should return 400)**
```bash
curl "http://localhost:3000/api/github/branches?owner=Vipin-Gup&repo=ppp-fe&accountId=243c7cd0-4e7b-4da0-a570-8922a7837e4a&enterpriseId=a248a56f-c187-438b-97f8-955030f4bbe3"
```

6. **Invalid Owner Format (Should return 400)**
```bash
curl "http://localhost:3000/api/github/branches?credentialName=Github_Account_Fin_Cred&owner=invalid-owner-!!!&repo=ppp-fe&accountId=243c7cd0-4e7b-4da0-a570-8922a7837e4a&enterpriseId=a248a56f-c187-438b-97f8-955030f4bbe3"
```

7. **Non-existent Credential (Should return 404)**
```bash
curl "http://localhost:3000/api/github/branches?credentialName=NonExistentCred&owner=Vipin-Gup&repo=ppp-fe&accountId=243c7cd0-4e7b-4da0-a570-8922a7837e4a&enterpriseId=a248a56f-c187-438b-97f8-955030f4bbe3"
```

8. **Non-existent Repository (Should return 404)**
```bash
curl "http://localhost:3000/api/github/branches?credentialName=Github_Account_Fin_Cred&owner=Vipin-Gup&repo=non-existent-repo&accountId=243c7cd0-4e7b-4da0-a570-8922a7837e4a&enterpriseId=a248a56f-c187-438b-97f8-955030f4bbe3"
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "owner and repo parameters are required"
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

Or for non-existent repository:
```json
{
  "success": false,
  "message": "GitHub repository \"Vipin-Gup/ppp-fe\" not found or not accessible",
  "error": "GitHub API error: 404 - Not Found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Error fetching branches from GitHub API",
  "error": "GitHub API error: 401 - Unauthorized"
}
```

## Security Considerations

1. **Token Encryption**: Always encrypt OAuth tokens before storing in the database (reuse existing encryption from repos endpoint)
2. **HTTPS Only**: Ensure all API calls use HTTPS in production
3. **Rate Limiting**: Implement rate limiting to prevent abuse
4. **Input Validation**: Validate all input parameters to prevent injection attacks
5. **Token Expiration**: Check token expiration before making API calls
6. **Error Messages**: Don't expose sensitive information in error messages
7. **Repository Access**: Ensure the OAuth token has access to the requested repository

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

- The endpoint supports pagination but limits to 3 pages (300 branches) by default. You can extend this if needed.
- GitHub API rate limits: 5,000 requests per hour for authenticated requests
- The `name` field is required in the response, which is what the frontend expects
- Tokens are stored encrypted in the database for security
- The endpoint handles both credential-based and connector-based OAuth tokens
- This endpoint reuses the same token storage mechanism as `/api/github/repos`

## Integration with Frontend

The frontend expects the response to be an array of branch objects with at least the `name` field:

```javascript
// Frontend usage
const response = await api.get(`/api/github/branches?credentialName=${credentialName}&owner=${owner}&repo=${repo}&accountId=${accountId}&enterpriseId=${enterpriseId}`);
const branches = response.map(branch => branch.name).filter(Boolean);
```

Make sure your response includes the `name` field for each branch.

## Example Response

Based on the GitHub API response from `https://api.github.com/repos/Vipin-Gup/ppp-fe/branches`:

```json
[
  {
    "name": "main",
    "commit": {
      "sha": "f716595fa7c7c8d31b66a6dffe0e7ebc71af715f",
      "url": "https://api.github.com/repos/Vipin-Gup/ppp-fe/commits/f716595fa7c7c8d31b66a6dffe0e7ebc71af715f"
    },
    "protected": false
  },
  {
    "name": "main-bkp",
    "commit": {
      "sha": "d1952ec3c08b96df7166b5840584d32df6aab24e",
      "url": "https://api.github.com/repos/Vipin-Gup/ppp-fe/commits/d1952ec3c08b96df7166b5840584d32df6aab24e"
    },
    "protected": false
  },
  {
    "name": "vip-gup",
    "commit": {
      "sha": "f716595fa7c7c8d31b66a6dffe0e7ebc71af715f",
      "url": "https://api.github.com/repos/Vipin-Gup/ppp-fe/commits/f716595fa7c7c8d31b66a6dffe0e7ebc71af715f"
    },
    "protected": false
  },
  {
    "name": "vip-gup-fe",
    "commit": {
      "sha": "8a6cd811298e7b5c6df0126540c9a538f66abb47",
      "url": "https://api.github.com/repos/Vipin-Gup/ppp-fe/commits/8a6cd811298e7b5c6df0126540c9a538f66abb47"
    },
    "protected": false
  },
  {
    "name": "vip-gup-systivaappfe",
    "commit": {
      "sha": "f1aa61f53bbd3567f79a6202c03865b44df39b4d",
      "url": "https://api.github.com/repos/Vipin-Gup/ppp-fe/commits/f1aa61f53bbd3567f79a6202c03865b44df39b4d"
    },
    "protected": false
  }
]
```

The frontend will extract the `name` field from each branch object and display them in a dropdown.

