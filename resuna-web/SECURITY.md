# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability, **do not open a public issue**.

Send details privately to: **lirielcastroreis@gmail.com**

Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (optional)

You will receive a response within **72 hours**.

## Scope

**In scope:**
- Authentication and authorization bypass
- Access to another user's data (IDOR)
- XSS, CSRF, injection attacks
- Sensitive data leakage in API responses or logs
- Insecure direct object reference

**Out of scope:**
- Denial of service (DoS/DDoS)
- Social engineering
- Issues requiring physical access to a device
- Vulnerabilities in third-party services (Firebase, Google Cloud, OpenRouter, Cloudflare)

## Security Model

- Resume content is stored locally in the user's browser (localStorage) and is only sent to the server during AI operations
- All API endpoints require Firebase Authentication — unauthenticated requests are rejected
- Each resume is bound to a `userId`; the backend verifies ownership on every read, write and delete
- Firestore rules enforce deny-by-default; clients have no direct read/write access to other users' data
- All writes to Firestore go through the backend via the Firebase Admin SDK

## Supported Versions

Only the latest production version at [resuna.app](https://resuna.app) is actively maintained.
