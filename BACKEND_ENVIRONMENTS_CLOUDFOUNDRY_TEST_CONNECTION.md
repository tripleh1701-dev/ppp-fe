# Backend Implementation: Environment Connectivity Test (Cloud Foundry)

This document describes the **end-to-end backend implementation** required for the **Environment Connectivity Test** initiated from the frontend **EnvironmentModal**.

## What changed vs previous approach

- The EnvironmentModal **does not persist environment details in a backend DB** (it’s stored in browser localStorage only).
- The EnvironmentModal now **fetches the selected credential details from Manage Credentials localStorage** and sends the **required authentication fields** directly in the payload.
- Therefore, the backend **must NOT** fetch credentials from DB/localStorage for this test. The backend should:
  - validate the incoming request
  - run connectivity logic based on `authenticationType`
  - return a clear success/failed response

---

## 1) Endpoint to implement

### Route

- **POST** `/api/environments/cloudfoundry/test-connection`

### Content type

- `application/json`

---

## 2) Request payload (must match FE)

The frontend sends **context + hostUrl + credentialName + auth details**.

### 2.1 Context fields (required)

- `accountId` (string)
- `accountName` (string)
- `enterpriseId` (string)
- `enterpriseName` (string)
- `workstream` (string)
- `product` (string)
- `service` (string)

> IMPORTANT: No hardcoded values should be used server-side. Treat these as required and validate them.

### 2.2 Target fields (required)

- `credentialName` (string)  
  - The selected **IFlow credential name** (used for audit/logging and debugging).
- `hostUrl` (string)  
  - The URL to test connectivity against (frontend requires it; backend must validate it).

### 2.3 Authentication fields (required; depends on authenticationType)

- `authenticationType` (string)

#### If `authenticationType === 'OAuth2'` (required)

- `oauth2ClientId` (string)
- `oauth2ClientSecret` (string)
- `oauth2TokenUrl` (string)

#### Else (Basic-style) (required)

- `username` (string)
- `apiKey` (string)

> NOTE: The frontend stores “Basic-style” secret in the field `apiKey` for consistency with existing credential schema.
> Backend should treat `apiKey` as the **secret/password** value for Basic Auth unless your target requires a different header scheme.

---

## 3) Response contract (frontend-compatible)

Frontend expects `success/status/connected/message`. Keep the response stable.

### Success

```json
{
  "success": true,
  "status": "success",
  "connected": true,
  "message": "Connection successful"
}
```

### Failure

```json
{
  "success": false,
  "status": "failed",
  "connected": false,
  "message": "Connection failed: <reason>"
}
```

### HTTP status codes

- You may return **200** for both success/failure (simplest for FE), or:
  - `400` for validation failures
  - `500` for unexpected exceptions

Either approach works; ensure FE gets a clear error `message`.

---

## 4) Validation rules (fail fast)

### 4.1 Validate required context fields

Fail if missing/empty:

- `accountId`, `accountName`, `enterpriseId`, `enterpriseName`, `workstream`, `product`, `service`

Example error message:

- `"Missing accountId"`

### 4.2 Validate target fields

Fail if missing/empty:

- `credentialName`
- `hostUrl`

Validate `hostUrl`:

- Must be a valid **absolute** URL (e.g. `https://...`).
- Use your platform URL parser (e.g., `new URL(hostUrl)` in Node) and reject invalid formats.

If invalid:

- `"Invalid hostUrl"`

### 4.3 Validate authentication fields

Fail if missing/empty:

- `authenticationType`

If `authenticationType === 'OAuth2'`:

- `oauth2ClientId`, `oauth2ClientSecret`, `oauth2TokenUrl` must be present
- validate `oauth2TokenUrl` as an absolute URL

Else (Basic-style):

- `username`, `apiKey` must be present

---

## 5) Connectivity test logic (based on authenticationType)

Use timeouts to avoid hanging:

- Token call timeout: **10 seconds**
- Host call timeout: **10 seconds**

Frontend shows “Test in Progress” with a **minimum** spinner time; mirror that:

- Minimum duration: **2500ms**

Implementation requirement:

- Capture `startedAt = now()`
- Always delay the response so that total runtime is at least `2500ms`:
  - if `(now() - startedAt) < 2500` → sleep remaining ms

### 5.1 OAuth2 path (`authenticationType === 'OAuth2'`)

Perform a **client credentials** token request, then call hostUrl with Bearer token.

#### Step A — get access token

- `POST oauth2TokenUrl`
- Headers: `Content-Type: application/x-www-form-urlencoded`
- Body (URL-encoded):
  - `grant_type=client_credentials`
  - `client_id=<oauth2ClientId>`
  - `client_secret=<oauth2ClientSecret>`
  - Optionally: `scope=<scope>` if your token endpoint requires it

If token response is not 2xx:

- Fail with message:
  - `"OAuth2 token request failed (status <code>)"`

Parse JSON response and extract `access_token`.

If `access_token` missing/empty:

- Fail with message:
  - `"OAuth2 token response missing access_token"`

#### Step B — call Host URL

- `GET hostUrl`
- Header:
  - `Authorization: Bearer <access_token>`

Success criteria:

- 2xx → success
- Non-2xx → fail:
  - `"Host request failed (status <code>)"`

### 5.2 Basic-style path (`authenticationType !== 'OAuth2'`)

By default, implement **HTTP Basic Auth** using `username` + `apiKey`:

- Header:
  - `Authorization: Basic base64(username:apiKey)`
- `GET hostUrl`

Success criteria:

- 2xx → success
- Non-2xx → fail:
  - `"Host request failed (status <code>)"`

> If your target expects a different scheme (e.g. `x-api-key`), adjust this section, but keep payload unchanged unless FE is updated.

---

## 6) Logging (do not leak secrets)

Log (info level):

- `accountId`, `enterpriseId`, `workstream`, `product`, `service`
- `credentialName`
- `authenticationType`
- `hostUrl`
- token endpoint hostname (NOT the secret)
- status codes for:
  - token request
  - host request
- total duration

Never log:

- `oauth2ClientSecret`
- `apiKey`
- `access_token`

Mask secrets if you must log presence:

- show `****` or only length

---

## 7) Security requirements (recommended)

Because this endpoint performs outbound HTTP calls, implement SSRF protections:

- Reject hostnames/IPs that resolve to:
  - `localhost`
  - private IP ranges (RFC1918)
  - link-local
  - cloud metadata IPs (e.g. `169.254.169.254`)
- Consider allow-listing trusted domains if possible.
- Add rate limiting to avoid abuse.

---

## 8) Minimal pseudo-code (framework agnostic)

```text
POST /api/environments/cloudfoundry/test-connection
  startedAt = now()

  validate required fields
  validate hostUrl and (if OAuth2) oauth2TokenUrl

  if authenticationType == "OAuth2":
     tokenResp = POST oauth2TokenUrl (form-urlencoded grant_type=client_credentials ...)
     if tokenResp !2xx: fail
     access_token = tokenResp.json.access_token
     if missing: fail
     hostResp = GET hostUrl with Authorization: Bearer access_token
  else:
     hostResp = GET hostUrl with Authorization: Basic base64(username:apiKey)

  success = hostResp is 2xx

  sleep so total duration >= 2500ms

  return { success, status, connected, message }
```

---

## 9) Notes for backend team

- The `credentialName` is included so you can correlate logs with the UI. The backend does not need to look it up.
- The backend should remain compatible if additional auth types are introduced later; treat unknown auth types as invalid or map them intentionally.


