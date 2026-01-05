# GitHub Account URL OAuth Connectivity Test - Backend Implementation Guide

## Overview

This guide provides step-by-step instructions for implementing connectivity testing for GitHub Account URLs using OAuth authentication. This extends the existing GitHub Repository URL connectivity test functionality to support Account-level connectivity testing.

## Current Implementation Context

The existing backend already supports:
- **GitHub Repository URL** connectivity testing with HTTP authentication (Username + Personal Access Token)
- Endpoint: `POST /api/connectors/github/test-connection`

## New Requirement

Add support for:
- **GitHub Account URL** connectivity testing with OAuth authentication
- URL Type: "Account" (e.g., `https://github.com/Vipin-Gup`)
- Connection Type: "HTTP"
- Authentication Type: "OAuth"

## Frontend Payload Structure

When the user selects:
- Category: "Code"
- Connector: "GitHub"
- URL Type: "Account"
- Connection Type: "HTTP"
- GitHub Account URL: `https://github.com/Vipin-Gup`
- Authentication Type: "OAuth"

The frontend will send the following payload to `POST /api/connectors/github/test-connection`:

```json
{
  "connectorName": "GitHub",
  "url": "https://github.com/Vipin-Gup",
  "urlType": "Account",
  "connectionType": "HTTP",
  "authenticationType": "OAuth",
  "credentialName": "your-github-credential-name",
  "accountId": "account-uuid",
  "accountName": "Account Name",
  "enterpriseId": "enterprise-uuid",
  "enterpriseName": "Enterprise Name",
  "workstream": "Workstream Name",
  "product": "Product Name",
  "service": "Service Name"
}
```

## Backend Implementation Steps

### Step 1: Update Request Payload Interface

Update your request payload interface/type to include the new fields:

```typescript
interface GitHubTestConnectionRequest {
  connectorName: string;
  url: string;
  urlType?: 'Account' | 'Repository'; // NEW: Indicates Account or Repository URL
  connectionType?: 'HTTP' | 'SSH';    // NEW: Indicates HTTP or SSH connection
  authenticationType?: 'OAuth' | 'Username and Token' | 'Personal Access Token'; // NEW: OAuth support
  credentialName: string;
  accountId?: string;
  accountName?: string;
  enterpriseId?: string;
  enterpriseName?: string;
  workstream?: string;
  product?: string;
  service?: string;
  // Legacy fields (for backward compatibility)
  username?: string;
  personalAccessToken?: string;
  apiToken?: string;
}
```

### Step 2: Retrieve OAuth Token from Credential Storage

When `authenticationType === 'OAuth'`, retrieve the OAuth token from your credential storage:

```typescript
async function getOAuthTokenFromCredential(
  credentialName: string,
  accountId: string,
  enterpriseId: string
): Promise<string | null> {
  // TODO: Implement logic to retrieve OAuth token from your credential storage
  // This should match how you store OAuth tokens in Manage Credentials screen
  
  // Example implementation (adjust based on your storage mechanism):
  // 1. Query your credentials database/table
  // 2. Find credential matching: credentialName, accountId, enterpriseId
  // 3. Extract OAuth token from the credential's connector configuration
  // 4. Return the OAuth token (access_token)
  
  // Pseudo-code:
  // const credential = await CredentialModel.findOne({
  //   where: {
  //     credentialName,
  //     accountId,
  //     enterpriseId
  //   }
  // });
  // 
  // if (credential && credential.connectors) {
  //   const githubConnector = credential.connectors.find(
  //     c => c.connector === 'GitHub'
  //   );
  //   return githubConnector?.oauthToken || githubConnector?.accessToken || null;
  // }
  
  return null;
}
```

### Step 3: Implement GitHub Account URL Connectivity Test

Add logic to handle Account URL testing with OAuth:

```typescript
async function testGitHubAccountConnectivity(
  accountUrl: string,
  oauthToken: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Extract account username from URL
    // Example: https://github.com/Vipin-Gup -> Vipin-Gup
    const urlMatch = accountUrl.match(/github\.com\/([\w.-]+)/i);
    if (!urlMatch || !urlMatch[1]) {
      return {
        success: false,
        message: 'Invalid GitHub Account URL format. Expected: https://github.com/USERNAME'
      };
    }
    
    const accountUsername = urlMatch[1];
    
    // Test connectivity by making an authenticated API call to GitHub
    // Use GitHub REST API v3: GET /users/{username}
    const githubApiUrl = `https://api.github.com/users/${accountUsername}`;
    
    const response = await fetch(githubApiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${oauthToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Your-App-Name' // GitHub requires User-Agent header
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 401) {
        return {
          success: false,
          message: 'OAuth token is invalid or expired. Please re-authenticate in Manage Credentials.'
        };
      }
      
      if (response.status === 404) {
        return {
          success: false,
          message: `GitHub account "${accountUsername}" not found. Please verify the account URL.`
        };
      }
      
      return {
        success: false,
        message: `GitHub API error: ${errorData.message || response.statusText}`
      };
    }
    
    const userData = await response.json();
    
    // Verify that the account exists and is accessible
    if (userData.login && userData.login.toLowerCase() === accountUsername.toLowerCase()) {
      return {
        success: true,
        message: `Successfully connected to GitHub account "${accountUsername}"`
      };
    }
    
    return {
      success: false,
      message: 'Unable to verify GitHub account connectivity'
    };
    
  } catch (error) {
    console.error('GitHub Account connectivity test error:', error);
    return {
      success: false,
      message: `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}
```

### Step 4: Update Main Test Connection Handler

Update your main test connection handler to route to the appropriate test function:

```typescript
async function testGitHubConnection(req: Request, res: Response) {
  try {
    const {
      url,
      urlType,
      connectionType,
      authenticationType,
      credentialName,
      accountId,
      enterpriseId,
      // Legacy fields
      username,
      personalAccessToken
    } = req.body;
    
    // Validate required fields
    if (!url || !credentialName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: url and credentialName'
      });
    }
    
    // Validate accountId and enterpriseId for OAuth
    if (authenticationType === 'OAuth' && (!accountId || !enterpriseId)) {
      return res.status(400).json({
        success: false,
        message: 'accountId and enterpriseId are required for OAuth authentication'
      });
    }
    
    let result: { success: boolean; message: string };
    
    // Route to appropriate test function based on URL Type and Authentication Type
    if (urlType === 'Account' && authenticationType === 'OAuth') {
      // NEW: Account URL with OAuth
      const oauthToken = await getOAuthTokenFromCredential(
        credentialName,
        accountId!,
        enterpriseId!
      );
      
      if (!oauthToken) {
        return res.status(400).json({
          success: false,
          message: 'OAuth token not found. Please ensure OAuth is configured in Manage Credentials.'
        });
      }
      
      result = await testGitHubAccountConnectivity(url, oauthToken);
      
    } else if (urlType === 'Repository' && connectionType === 'HTTP') {
      // EXISTING: Repository URL with HTTP (Username + Personal Access Token)
      // Keep existing implementation
      if (!username || !personalAccessToken) {
        return res.status(400).json({
          success: false,
          message: 'Username and Personal Access Token are required for Repository URL testing'
        });
      }
      
      result = await testGitHubRepositoryConnectivity(url, username, personalAccessToken);
      
    } else {
      return res.status(400).json({
        success: false,
        message: `Unsupported combination: urlType=${urlType}, connectionType=${connectionType}, authenticationType=${authenticationType}`
      });
    }
    
    // Return response
    return res.json({
      success: result.success,
      status: result.success ? 'success' : 'failed',
      connected: result.success,
      message: result.message
    });
    
  } catch (error) {
    console.error('GitHub connectivity test error:', error);
    return res.status(500).json({
      success: false,
      status: 'failed',
      connected: false,
      message: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}
```

### Step 5: Add Helper Function for Repository Testing (if not exists)

If you don't already have a repository testing function, here's a reference implementation:

```typescript
async function testGitHubRepositoryConnectivity(
  repoUrl: string,
  username: string,
  personalAccessToken: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Extract owner and repo name from URL
    // Example: https://github.com/owner/repo.git -> owner, repo
    const urlMatch = repoUrl.match(/github\.com\/([\w.-]+)\/([\w.-]+)\.git/i);
    if (!urlMatch || !urlMatch[1] || !urlMatch[2]) {
      return {
        success: false,
        message: 'Invalid GitHub Repository URL format. Expected: https://github.com/OWNER/REPO.git'
      };
    }
    
    const owner = urlMatch[1];
    const repo = urlMatch[2];
    
    // Test connectivity by making an authenticated API call to GitHub
    const githubApiUrl = `https://api.github.com/repos/${owner}/${repo}`;
    
    const authString = Buffer.from(`${username}:${personalAccessToken}`).toString('base64');
    
    const response = await fetch(githubApiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Your-App-Name'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 401) {
        return {
          success: false,
          message: 'Invalid credentials. Please verify username and personal access token.'
        };
      }
      
      if (response.status === 404) {
        return {
          success: false,
          message: `Repository "${owner}/${repo}" not found or access denied.`
        };
      }
      
      return {
        success: false,
        message: `GitHub API error: ${errorData.message || response.statusText}`
      };
    }
    
    const repoData = await response.json();
    
    if (repoData.full_name && repoData.full_name.toLowerCase() === `${owner}/${repo}`.toLowerCase()) {
      return {
        success: true,
        message: `Successfully connected to repository "${owner}/${repo}"`
      };
    }
    
    return {
      success: false,
      message: 'Unable to verify repository connectivity'
    };
    
  } catch (error) {
    console.error('GitHub Repository connectivity test error:', error);
    return {
      success: false,
      message: `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}
```

## API Endpoint Summary

**Endpoint:** `POST /api/connectors/github/test-connection`

### Request Payload Examples

#### Account URL with OAuth (NEW)
```json
{
  "connectorName": "GitHub",
  "url": "https://github.com/Vipin-Gup",
  "urlType": "Account",
  "connectionType": "HTTP",
  "authenticationType": "OAuth",
  "credentialName": "github-oauth-credential",
  "accountId": "243c7cd0-4e7b-4da0-a570-8922a7837e4a",
  "enterpriseId": "a248a56f-c187-438b-97f8-955030f4bbe3"
}
```

#### Repository URL with HTTP (EXISTING)
```json
{
  "connectorName": "GitHub",
  "url": "https://github.com/owner/repo.git",
  "urlType": "Repository",
  "connectionType": "HTTP",
  "authenticationType": "Username and Token",
  "credentialName": "github-credential",
  "username": "username",
  "personalAccessToken": "ghp_xxxxxxxxxxxx"
}
```

### Response Format

**Success Response:**
```json
{
  "success": true,
  "status": "success",
  "connected": true,
  "message": "Successfully connected to GitHub account \"Vipin-Gup\""
}
```

**Failure Response:**
```json
{
  "success": false,
  "status": "failed",
  "connected": false,
  "message": "OAuth token is invalid or expired. Please re-authenticate in Manage Credentials."
}
```

## Error Handling

Handle the following error scenarios:

1. **Missing OAuth Token**
   - Status: 400
   - Message: "OAuth token not found. Please ensure OAuth is configured in Manage Credentials."

2. **Invalid OAuth Token**
   - Status: 200 (with success: false)
   - Message: "OAuth token is invalid or expired. Please re-authenticate in Manage Credentials."

3. **Account Not Found**
   - Status: 200 (with success: false)
   - Message: "GitHub account \"USERNAME\" not found. Please verify the account URL."

4. **Invalid URL Format**
   - Status: 200 (with success: false)
   - Message: "Invalid GitHub Account URL format. Expected: https://github.com/USERNAME"

5. **Network/API Errors**
   - Status: 500
   - Message: "Connection error: [error details]"

## Testing

### Test Cases

1. **Valid Account URL with Valid OAuth Token**
   - Input: `https://github.com/Vipin-Gup` with valid OAuth token
   - Expected: Success response

2. **Invalid Account URL Format**
   - Input: `https://github.com/` (missing username)
   - Expected: Error message about invalid format

3. **Non-existent Account**
   - Input: `https://github.com/nonexistent-account-12345` with valid OAuth token
   - Expected: 404 error message

4. **Invalid/Expired OAuth Token**
   - Input: Valid URL with invalid/expired token
   - Expected: 401 error message

5. **Missing Required Fields**
   - Input: Missing `accountId` or `enterpriseId`
   - Expected: 400 error message

### Manual Testing with cURL

```bash
# Test Account URL with OAuth
curl -X POST http://localhost:4000/api/connectors/github/test-connection \
  -H "Content-Type: application/json" \
  -d '{
    "connectorName": "GitHub",
    "url": "https://github.com/Vipin-Gup",
    "urlType": "Account",
    "connectionType": "HTTP",
    "authenticationType": "OAuth",
    "credentialName": "github-oauth-credential",
    "accountId": "243c7cd0-4e7b-4da0-a570-8922a7837e4a",
    "enterpriseId": "a248a56f-c187-438b-97f8-955030f4bbe3"
  }'
```

## Security Considerations

1. **OAuth Token Storage**: Ensure OAuth tokens are stored securely (encrypted) in your credential storage
2. **Token Validation**: Validate OAuth tokens before making API calls
3. **Rate Limiting**: Implement rate limiting for GitHub API calls to avoid hitting GitHub's rate limits
4. **Error Messages**: Don't expose sensitive information in error messages
5. **HTTPS**: Always use HTTPS for API endpoints in production

## GitHub API Rate Limits

- **Authenticated Requests**: 5,000 requests per hour per OAuth token
- **Unauthenticated Requests**: 60 requests per hour per IP address

For connectivity testing, authenticated requests are recommended to avoid rate limit issues.

## Additional Notes

1. **Backward Compatibility**: Ensure existing Repository URL testing continues to work
2. **OAuth Token Refresh**: Consider implementing OAuth token refresh logic if tokens expire
3. **Logging**: Log all connectivity test attempts for debugging and audit purposes
4. **Caching**: Consider caching successful connectivity test results for a short period to reduce API calls

## Implementation Checklist

- [ ] Update request payload interface to include `urlType`, `connectionType`, `authenticationType`
- [ ] Implement `getOAuthTokenFromCredential()` function
- [ ] Implement `testGitHubAccountConnectivity()` function
- [ ] Update main test connection handler to route based on URL type and auth type
- [ ] Add error handling for all error scenarios
- [ ] Add logging for debugging
- [ ] Test with valid Account URL and OAuth token
- [ ] Test with invalid Account URL format
- [ ] Test with invalid/expired OAuth token
- [ ] Test with non-existent account
- [ ] Verify backward compatibility with existing Repository URL testing
- [ ] Update API documentation

## Support

For questions or issues during implementation, refer to:
- GitHub REST API Documentation: https://docs.github.com/en/rest
- GitHub OAuth Documentation: https://docs.github.com/en/apps/oauth-apps





