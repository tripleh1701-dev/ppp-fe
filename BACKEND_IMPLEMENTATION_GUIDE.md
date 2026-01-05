# Backend Implementation Guide: Integration Artifacts API

## Overview
This document provides step-by-step instructions for implementing the backend API endpoint that fetches Integration Packages and their associated artifacts (IFLOW, Value Mapping, Script Collection) from SAP Cloud Platform Integration (CPI) based on authentication credentials provided by the frontend.

The backend will:
1. Fetch Integration Packages from `/api/v1/IntegrationPackages`
2. For each package, fetch its child artifacts:
   - IntegrationDesigntimeArtifacts (IFLOW)
   - ValueMappingDesigntimeArtifacts (VALUE MAPPING)
   - ScriptCollectionDesigntimeArtifacts (SCRIPT COLLECTION)
3. Return a nested structure that the frontend will display as expandable rows

## API Endpoint

**Endpoint**: `POST /api/integration-artifacts/fetch-packages`

## Request Payload Structure

The frontend will send a POST request with the following payload structure:

```json
{
  "apiUrl": "https://your-cpi-instance.cfapps.eu10.hana.ondemand.com/api/v1/IntegrationPackages",
  "authenticationType": "OAuth2" | "Basic" | "Username and API Key",
  "accountId": "string",
  "accountName": "string",
  "enterpriseId": "string",
  "enterpriseName": "string",
  "workstream": "string",
  "product": "string",
  "service": "string",
  "environmentName": "string",
  "credentialName": "string",
  
  // For OAuth2 authentication:
  "oauth2ClientId": "string",
  "oauth2ClientSecret": "string",
  "oauth2TokenUrl": "string",
  
  // For Basic Auth / Username and API Key:
  "username": "string",
  "apiKey": "string"
}
```

## Implementation Steps

### Step 1: Create the Route Handler

Create a new route file or add to your existing routes:

**File**: `routes/integrationArtifacts.js` (or similar)

```javascript
const express = require('express');
const router = express.Router();
const { fetchIntegrationPackages } = require('../controllers/integrationArtifactsController');

router.post('/fetch-packages', fetchIntegrationPackages);

module.exports = router;
```

### Step 2: Create the Controller

**File**: `controllers/integrationArtifactsController.js`

```javascript
const axios = require('axios');
const https = require('https');

/**
 * Fetch Integration Packages from SAP CPI
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.fetchIntegrationPackages = async (req, res) => {
    try {
        const {
            apiUrl,
            authenticationType,
            oauth2ClientId,
            oauth2ClientSecret,
            oauth2TokenUrl,
            username,
            apiKey,
            accountId,
            accountName,
            enterpriseId,
            environmentName,
            credentialName
        } = req.body;

        // Validate required fields
        if (!apiUrl) {
            return res.status(400).json({
                success: false,
                error: 'API URL is required'
            });
        }

        if (!authenticationType) {
            return res.status(400).json({
                success: false,
                error: 'Authentication type is required'
            });
        }

        // Get authentication token/credentials based on authentication type
        let authHeaders = {};
        
        if (authenticationType === 'OAuth2') {
            // Validate OAuth2 fields
            if (!oauth2ClientId || !oauth2ClientSecret || !oauth2TokenUrl) {
                return res.status(400).json({
                    success: false,
                    error: 'OAuth2 credentials are incomplete. Client ID, Client Secret, and Token URL are required.'
                });
            }

            // Step 1: Get OAuth2 access token
            const accessToken = await getOAuth2Token(oauth2ClientId, oauth2ClientSecret, oauth2TokenUrl);
            
            if (!accessToken) {
                return res.status(401).json({
                    success: false,
                    error: 'Failed to obtain OAuth2 access token'
                });
            }

            // Step 2: Set Authorization header with Bearer token
            authHeaders = {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            };
        } else if (authenticationType === 'Basic' || authenticationType === 'Username and API Key') {
            // Validate Basic Auth fields
            if (!username || !apiKey) {
                return res.status(400).json({
                    success: false,
                    error: 'Username and API Key are required for Basic authentication'
                });
            }

            // Create Basic Auth header
            const credentials = Buffer.from(`${username}:${apiKey}`).toString('base64');
            authHeaders = {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            };
        } else {
            return res.status(400).json({
                success: false,
                error: `Unsupported authentication type: ${authenticationType}`
            });
        }

        // Step 3: Make GET request to fetch Integration Packages
        const response = await axios.get(apiUrl, {
            headers: authHeaders,
            httpsAgent: new https.Agent({
                rejectUnauthorized: false // Set to true in production with proper certificates
            }),
            timeout: 30000 // 30 seconds timeout
        });

        // Step 4: Parse and transform the response
        const packages = Array.isArray(response.data) 
            ? response.data 
            : (response.data.d?.results || response.data.results || []);

        // Step 5: For each package, fetch its artifacts
        const packagesWithArtifacts = await Promise.all(
            packages.map(async (pkg) => {
                const packageId = pkg.Id || pkg.id || pkg.Name;
                const packageName = pkg.Name || pkg.name || 'Unknown';
                const packageVersion = pkg.Version || pkg.version || pkg.VersionId || 'Unknown';

                // Construct artifact API URLs
                const baseUrl = apiUrl.replace('/api/v1/IntegrationPackages', '');
                const packageBaseUrl = `${baseUrl}/api/v1/IntegrationPackages('${packageId}')`;

                // Fetch IntegrationDesigntimeArtifacts (IFLOW)
                let integrationArtifacts = [];
                try {
                    const iflowResponse = await axios.get(
                        `${packageBaseUrl}/IntegrationDesigntimeArtifacts`,
                        {
                            headers: authHeaders,
                            httpsAgent: new https.Agent({
                                rejectUnauthorized: false
                            }),
                            timeout: 30000
                        }
                    );
                    const iflowData = Array.isArray(iflowResponse.data) 
                        ? iflowResponse.data 
                        : (iflowResponse.data.d?.results || iflowResponse.data.results || []);
                    integrationArtifacts = iflowData.map((item) => ({
                        Name: item.Name || item.name || 'Unknown',
                        Version: item.Version || item.version || 'Unknown',
                        Id: item.Id || item.id
                    }));
                } catch (error) {
                    console.warn(`Failed to fetch IntegrationDesigntimeArtifacts for package ${packageName}:`, error.message);
                }

                // Fetch ValueMappingDesigntimeArtifacts (VALUE MAPPING)
                let valueMappingArtifacts = [];
                try {
                    const vmResponse = await axios.get(
                        `${packageBaseUrl}/ValueMappingDesigntimeArtifacts`,
                        {
                            headers: authHeaders,
                            httpsAgent: new https.Agent({
                                rejectUnauthorized: false
                            }),
                            timeout: 30000
                        }
                    );
                    const vmData = Array.isArray(vmResponse.data) 
                        ? vmResponse.data 
                        : (vmResponse.data.d?.results || vmResponse.data.results || []);
                    valueMappingArtifacts = vmData.map((item) => ({
                        Name: item.Name || item.name || 'Unknown',
                        Version: item.Version || item.version || 'Unknown',
                        Id: item.Id || item.id
                    }));
                } catch (error) {
                    console.warn(`Failed to fetch ValueMappingDesigntimeArtifacts for package ${packageName}:`, error.message);
                }

                // Fetch ScriptCollectionDesigntimeArtifacts (SCRIPT COLLECTION)
                let scriptCollectionArtifacts = [];
                try {
                    const scResponse = await axios.get(
                        `${packageBaseUrl}/ScriptCollectionDesigntimeArtifacts`,
                        {
                            headers: authHeaders,
                            httpsAgent: new https.Agent({
                                rejectUnauthorized: false
                            }),
                            timeout: 30000
                        }
                    );
                    const scData = Array.isArray(scResponse.data) 
                        ? scResponse.data 
                        : (scResponse.data.d?.results || scResponse.data.results || []);
                    scriptCollectionArtifacts = scData.map((item) => ({
                        Name: item.Name || item.name || 'Unknown',
                        Version: item.Version || item.version || 'Unknown',
                        Id: item.Id || item.id
                    }));
                } catch (error) {
                    console.warn(`Failed to fetch ScriptCollectionDesigntimeArtifacts for package ${packageName}:`, error.message);
                }

                return {
                    Name: packageName,
                    Version: packageVersion,
                    Id: packageId,
                    IntegrationDesigntimeArtifacts: integrationArtifacts,
                    ValueMappingDesigntimeArtifacts: valueMappingArtifacts,
                    ScriptCollectionDesigntimeArtifacts: scriptCollectionArtifacts
                };
            })
        );

        // Step 6: Return success response
        return res.status(200).json({
            success: true,
            data: packagesWithArtifacts,
            count: packagesWithArtifacts.length
        });

    } catch (error) {
        console.error('Error fetching integration packages:', error);
        
        // Handle specific error cases
        if (error.response) {
            // API returned an error response
            return res.status(error.response.status || 500).json({
                success: false,
                error: error.response.data?.error?.message?.value || 
                      error.response.data?.error?.message || 
                      `API request failed with status ${error.response.status}`,
                details: error.response.data
            });
        } else if (error.request) {
            // Request was made but no response received
            return res.status(503).json({
                success: false,
                error: 'No response received from the API. Please check the API URL and network connectivity.'
            });
        } else {
            // Error in request setup
            return res.status(500).json({
                success: false,
                error: error.message || 'An unexpected error occurred while fetching integration packages'
            });
        }
    }
};

/**
 * Get OAuth2 access token
 * @param {string} clientId - OAuth2 Client ID
 * @param {string} clientSecret - OAuth2 Client Secret
 * @param {string} tokenUrl - OAuth2 Token URL
 * @returns {Promise<string>} - Access token
 */
async function getOAuth2Token(clientId, clientSecret, tokenUrl) {
    try {
        const response = await axios.post(
            tokenUrl,
            new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: clientId,
                client_secret: clientSecret
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json'
                },
                httpsAgent: new https.Agent({
                    rejectUnauthorized: false // Set to true in production
                }),
                timeout: 30000
            }
        );

        // Extract access token from response
        // Different OAuth2 providers may return tokens in different formats
        const accessToken = response.data.access_token || 
                           response.data.accessToken || 
                           response.data.token;

        if (!accessToken) {
            console.error('OAuth2 token response:', response.data);
            throw new Error('Access token not found in OAuth2 response');
        }

        return accessToken;
    } catch (error) {
        console.error('Error obtaining OAuth2 token:', error);
        if (error.response) {
            console.error('OAuth2 error response:', error.response.data);
            throw new Error(`OAuth2 authentication failed: ${error.response.data?.error_description || error.response.data?.error || 'Unknown error'}`);
        }
        throw error;
    }
}
```

### Step 3: Register the Route

In your main application file (e.g., `app.js` or `server.js`):

```javascript
const integrationArtifactsRoutes = require('./routes/integrationArtifacts');

// Register the route
app.use('/api/integration-artifacts', integrationArtifactsRoutes);
```

### Step 4: Install Required Dependencies

Make sure you have the required npm packages installed:

```bash
npm install axios
```

If using TypeScript:

```bash
npm install axios @types/node
```

### Step 5: Error Handling and Logging

Add comprehensive logging for debugging:

```javascript
// At the start of fetchIntegrationPackages function
console.log('📡 [IntegrationArtifacts] Received request:', {
    apiUrl,
    authenticationType,
    accountId,
    environmentName,
    credentialName,
    hasOAuth2Credentials: !!(oauth2ClientId && oauth2ClientSecret),
    hasBasicCredentials: !!(username && apiKey)
});
```

### Step 6: Response Format

The backend should return responses in the following format:

**Success Response:**
```json
{
  "success": true,
  "data": [
    {
      "Name": "MyIntegrationPackage",
      "Version": "1.0.0",
      "Id": "package-id-123",
      "IntegrationDesigntimeArtifacts": [
        {
          "Name": "MyIFlow",
          "Version": "1.0.0",
          "Id": "iflow-id-456"
        }
      ],
      "ValueMappingDesigntimeArtifacts": [
        {
          "Name": "MyValueMapping",
          "Version": "1.0.0",
          "Id": "vm-id-789"
        }
      ],
      "ScriptCollectionDesigntimeArtifacts": [
        {
          "Name": "MyScriptCollection",
          "Version": "1.0.0",
          "Id": "sc-id-012"
        }
      ]
    }
  ],
  "count": 1
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

## Authentication Types Supported

### 1. OAuth2
- Requires: `oauth2ClientId`, `oauth2ClientSecret`, `oauth2TokenUrl`
- Flow:
  1. POST to `oauth2TokenUrl` with client credentials
  2. Receive access token
  3. Use Bearer token in Authorization header

### 2. Basic Auth / Username and API Key
- Requires: `username`, `apiKey`
- Flow:
  1. Encode `username:apiKey` as Base64
  2. Use `Authorization: Basic <encoded>` header

## Security Considerations

1. **HTTPS**: Always use HTTPS in production
2. **Certificate Validation**: Set `rejectUnauthorized: true` in production with proper certificates
3. **Credential Storage**: Never log sensitive credentials (client secrets, API keys)
4. **Token Caching**: Consider implementing token caching for OAuth2 to reduce API calls
5. **Rate Limiting**: Implement rate limiting to prevent abuse
6. **Input Validation**: Validate all input parameters before processing

## Testing

### Test with OAuth2:
```bash
curl -X POST http://localhost:4000/api/integration-artifacts/fetch-packages \
  -H "Content-Type: application/json" \
  -d '{
    "apiUrl": "https://your-cpi-instance.cfapps.eu10.hana.ondemand.com/api/v1/IntegrationPackages",
    "authenticationType": "OAuth2",
    "oauth2ClientId": "your-client-id",
    "oauth2ClientSecret": "your-client-secret",
    "oauth2TokenUrl": "https://your-auth-server/oauth/token",
    "accountId": "test-account",
    "accountName": "Test Account",
    "enterpriseId": "test-enterprise",
    "enterpriseName": "Test Enterprise",
    "workstream": "Finance",
    "product": "DevOps",
    "service": "Integration",
    "environmentName": "Pre-Production",
    "credentialName": "CPI-API-Credential"
  }'
```

### Test with Basic Auth:
```bash
curl -X POST http://localhost:4000/api/integration-artifacts/fetch-packages \
  -H "Content-Type: application/json" \
  -d '{
    "apiUrl": "https://your-cpi-instance.cfapps.eu10.hana.ondemand.com/api/v1/IntegrationPackages",
    "authenticationType": "Basic",
    "username": "your-username",
    "apiKey": "your-api-key",
    "accountId": "test-account",
    "accountName": "Test Account",
    "enterpriseId": "test-enterprise",
    "enterpriseName": "Test Enterprise",
    "workstream": "Finance",
    "product": "DevOps",
    "service": "Integration",
    "environmentName": "Pre-Production",
    "credentialName": "CPI-API-Credential"
  }'
```

## Frontend Integration

The frontend will automatically:
1. Construct the API URL by appending `/api/v1/IntegrationPackages` to the API URL from the environment
2. Load credentials from localStorage
3. Send the payload to this backend endpoint
4. Display the results in the IntegrationArtifactsTable with:
   - **Parent Rows (Packages)**:
     - **Artifact Name**: `Name` from response
     - **Version**: `Version` from response
     - **Type**: "PACKAGE" (hardcoded)
     - **Synced By**: Account name
     - **Synced On**: Current timestamp
     - Expandable dropdown arrow to show child artifacts
   - **Child Rows (Artifacts)**:
     - **IntegrationDesigntimeArtifacts** → Type: "IFLOW"
     - **ValueMappingDesigntimeArtifacts** → Type: "VALUE MAPPING"
     - **ScriptCollectionDesigntimeArtifacts** → Type: "SCRIPT COLLECTION"
     - Each child shows Name, Version, Type, Synced By, Synced On
     - Indented with visual connector line

## Troubleshooting

### Common Issues:

1. **401 Unauthorized**: Check credentials and authentication type
2. **403 Forbidden**: Verify API URL and permissions
3. **404 Not Found**: Verify the API URL is correct
4. **Timeout**: Check network connectivity and increase timeout if needed
5. **Certificate Errors**: In development, `rejectUnauthorized: false` is acceptable, but use proper certificates in production

## Additional Notes

- The API URL sent from frontend already includes `/api/v1/IntegrationPackages`
- Response parsing should handle different SAP CPI API response formats
- Consider implementing retry logic for transient failures
- Add request/response logging for debugging (without sensitive data)

