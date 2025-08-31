# Database Persistence Debugging Guide

## Issue Summary
The frontend is unable to persist values in the database for:
- Enterprise Configuration
- Manage Accounts  
- Business Unit Settings
- Global Settings

## Frontend API Implementation Analysis

### 1. API Configuration
- **API Base URL**: `http://localhost:4000` (default)
- **Location**: `src/utils/api.ts`
- **Environment Variable**: `NEXT_PUBLIC_API_BASE`

### 2. API Endpoints Being Called
Based on code analysis, the frontend is making calls to:

#### Business Unit Settings
- `GET /api/business-units` - Fetch existing BU settings
- `POST /api/business-units` - Create new BU settings
- `PUT /api/business-units` - Update existing BU settings
- `DELETE /api/business-units/{id}` - Delete BU settings

#### Global Settings
- `GET /api/global-settings` - Fetch existing global settings
- `POST /api/global-settings` - Create new global settings
- `PUT /api/global-settings` - Update existing global settings
- `DELETE /api/global-settings/{id}` - Delete global settings

#### Accounts
- `GET /api/accounts` - Fetch existing accounts
- `POST /api/accounts` - Create new accounts
- `PUT /api/accounts` - Update existing accounts

#### Enterprises
- `GET /api/enterprises` - Fetch existing enterprises
- `POST /api/enterprises` - Create new enterprises
- `PUT /api/enterprises` - Update existing enterprises

### 3. Frontend Error Handling
The frontend has proper error handling:
- API calls are wrapped in try-catch blocks
- Failed requests are logged to console
- User feedback is provided for errors

## Debugging Steps

### Step 1: Check Backend Server Status
1. Verify backend server is running on port 4000
2. Check if server responds to basic health check: `http://localhost:4000/health`

### Step 2: Test API Connectivity
1. Navigate to `/dashboard` in the frontend
2. Scroll down to find the "API Connectivity Test" section
3. Click "Run API Tests" button
4. Review the test results for each endpoint

### Step 3: Check Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for error messages when making API calls
4. Check for CORS errors or network failures

### Step 4: Check Network Tab
1. Open browser DevTools (F12)
2. Go to Network tab
3. Try to create/save data in any of the forms
4. Look for failed HTTP requests
5. Check response status codes and error messages

### Step 5: Verify Environment Configuration
1. Check if `.env.local` file exists in project root
2. Verify `NEXT_PUBLIC_API_BASE` is set correctly
3. Default value is `http://localhost:4000`

## Common Issues and Solutions

### Issue 1: Backend Server Not Running
**Symptoms**: All API calls fail with "Failed to fetch" errors
**Solution**: Start the backend server on port 4000

### Issue 2: CORS Errors
**Symptoms**: Console shows CORS policy errors
**Solution**: Backend needs to allow requests from frontend origin

### Issue 3: Wrong API Base URL
**Symptoms**: API calls go to wrong endpoint
**Solution**: Set correct `NEXT_PUBLIC_API_BASE` in environment

### Issue 4: Backend API Endpoints Missing
**Symptoms**: 404 errors for API calls
**Solution**: Verify backend implements all required endpoints

### Issue 5: Database Connection Issues
**Symptoms**: Backend responds but with database errors
**Solution**: Check backend database configuration and connectivity

## Enhanced Debugging Tools

### 1. API Test Component
- Added to dashboard for easy testing
- Tests all major API endpoints
- Provides detailed error information
- Shows environment configuration

### 2. Enhanced Error Logging
- Detailed error logging for failed API calls
- Includes request data and response details
- Timestamps for debugging
- Environment information

### 3. Debug Utilities
- `src/utils/debugAPI.ts` - Enhanced debugging functions
- `src/utils/api.ts` - Standard API utility
- Both available for use in components

## Next Steps

1. **Run the API tests** from the dashboard to identify specific failures
2. **Check backend server status** and ensure it's running on port 4000
3. **Verify backend API endpoints** exist and are properly configured
4. **Check database connectivity** on the backend
5. **Review backend logs** for any error messages

## Backend Verification Checklist

- [ ] Backend server running on port 4000
- [ ] All required API endpoints implemented
- [ ] Database connection working
- [ ] CORS properly configured
- [ ] Request/response logging enabled
- [ ] Error handling implemented

## Frontend Verification Checklist

- [ ] Environment variables set correctly
- [ ] API calls being made to correct endpoints
- [ ] Error handling working properly
- [ ] User feedback provided for failures
- [ ] Console logging enabled for debugging

## Contact Information
If backend issues are identified, the backend team should be contacted to:
1. Verify server status
2. Check API endpoint implementation
3. Validate database connectivity
4. Review error logs
5. Test API endpoints independently
