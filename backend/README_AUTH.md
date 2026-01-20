# Authentication System Documentation

## Overview

Complete authentication system with:
- ✅ Secure password hashing (bcrypt, 12 rounds)
- ✅ Session-based authentication (secure cookies)
- ✅ Rate limiting on auth routes
- ✅ Email enumeration protection
- ✅ Input validation
- ✅ PostgreSQL (production) / SQLite (development)
- ✅ Full test coverage

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Set Environment Variables

```bash
cp env.example .env
```

**REQUIRED**: Generate and set `SESSION_SECRET`:
```bash
openssl rand -base64 32
```

Add to `.env`:
```
SESSION_SECRET=<generated-secret>
```

### 3. Run

```bash
# Development (uses SQLite)
npm run dev

# Production (requires DATABASE_URL)
npm start

# Tests
npm test
```

## API Endpoints

All endpoints are under `/api/auth`:

| Method | Endpoint | Auth Required | Description |
|--------|----------|----------------|-------------|
| POST | `/signup` | No | Create new account |
| POST | `/login` | No | Sign in |
| POST | `/logout` | No | Sign out |
| GET | `/me` | Yes | Get current user |

### POST /api/auth/signup

Create a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name"
}
```

**Response (201):**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "User Name",
    "created_at": "2025-01-19T..."
  }
}
```

**Validation:**
- Email: Valid format required
- Password: Minimum 8 characters
- Name: Required, trimmed

### POST /api/auth/login

Sign in with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

**Security:**
- Generic error message: "Invalid email or password"
- Prevents email enumeration
- Timing attack protection

### POST /api/auth/logout

Destroy current session.

**Response (200):**
```json
{
  "success": true,
  "message": "Signed out successfully"
}
```

### GET /api/auth/me

Get current authenticated user.

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

**Response (401) if not authenticated:**
```json
{
  "success": false,
  "error": "Authentication required"
}
```

## Using Protected Routes

Protect any route with `requireAuth` middleware:

```javascript
const { requireAuth } = require('../middleware/auth');

router.get('/protected', requireAuth, (req, res) => {
  // req.session.userId is available
  res.json({ message: 'This is protected!' });
});
```

## Frontend Usage

The frontend uses Vue composables:

```javascript
import { useAuth } from '@/composables/useAuth';

const { user, loading, login, signup, logout, loadUser } = useAuth();

// Load user on app start
onMounted(async () => {
  await loadUser();
});

// Sign up
const result = await signup(email, password, name);
if (result.success) {
  // User is now logged in
}

// Sign in
const result = await login(email, password);
if (result.success) {
  // User is now logged in
}

// Sign out
await logout();
```

## Database

### Development (SQLite)

- Auto-creates `dev.db` file
- No setup required
- Tables auto-created on first run

### Production (PostgreSQL)

Set `DATABASE_URL` environment variable:
```
DATABASE_URL=postgresql://user:password@host:port/database
```

Tables are auto-created on first run.

## Security Features

1. **Password Hashing**
   - Bcrypt with 12 rounds
   - Never stored in plain text

2. **Session Security**
   - HTTP-only cookies (not accessible via JavaScript)
   - Secure flag in production (HTTPS only)
   - SameSite=Lax (CSRF protection)
   - 7-day expiration

3. **Rate Limiting**
   - 5 requests per 15 minutes on auth routes
   - Prevents brute force attacks

4. **Email Enumeration Protection**
   - Generic error messages
   - Same response time for valid/invalid emails

5. **Input Validation**
   - Email format validation
   - Password strength (min 8 chars)
   - SQL injection protection (parameterized queries)

## Environment Variables

### Required

- `SESSION_SECRET` - Secret for session encryption (generate with `openssl rand -base64 32`)

### Optional

- `DATABASE_URL` - PostgreSQL connection string (uses SQLite if not set)
- `CORS_ORIGIN` - Allowed frontend origin
- `CLIENT_ORIGIN` - Frontend URL for cookie settings
- `NODE_ENV` - `production` or `development`
- `PORT` - Server port (default: 3000)
- `DB_PATH` - SQLite database path (default: `./dev.db`)

## Testing

Run tests:
```bash
npm test
```

Tests cover:
- ✅ Signup with valid/invalid data
- ✅ Login with valid/invalid credentials
- ✅ Session creation/destruction
- ✅ Protected route access
- ✅ Rate limiting

## Railway Deployment

### Required Environment Variables

```
NODE_ENV=production
SESSION_SECRET=<generate-secure-secret>
DATABASE_URL=<railway-postgres-url>
CORS_ORIGIN=https://your-frontend.vercel.app
CLIENT_ORIGIN=https://your-frontend.vercel.app
```

### Notes

- Railway provides `DATABASE_URL` automatically when you add PostgreSQL
- Session store uses PostgreSQL in production
- Cookies are `Secure` (HTTPS only) in production
- Ensure frontend sets `credentials: 'include'` on all API calls

## Troubleshooting

### "Session save error"
- Check `SESSION_SECRET` is set
- In production, ensure PostgreSQL is connected

### "Database connection error"
- Check `DATABASE_URL` format (if using PostgreSQL)
- Ensure PostgreSQL service is running (Railway)

### "CORS error"
- Verify `CORS_ORIGIN` matches frontend URL exactly
- Check frontend uses `credentials: 'include'`

### "Authentication required" on /me
- Ensure cookies are being sent (check browser DevTools)
- Verify session middleware is configured
- Check `SESSION_SECRET` is set
