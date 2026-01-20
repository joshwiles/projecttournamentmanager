# Authentication Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Set Environment Variables

Copy `env.example` to `.env`:

```bash
cp env.example .env
```

**Required**: Set `SESSION_SECRET`. Generate a secure secret:

```bash
openssl rand -base64 32
```

Add to `.env`:
```
SESSION_SECRET=your-generated-secret-here
```

### 3. Run Locally

```bash
npm run dev
```

The database (SQLite) will be auto-created on first run.

### 4. Run Tests

```bash
npm test
```

## Production Setup (Railway)

### Environment Variables

Set these in Railway:

```
NODE_ENV=production
PORT=3000
SESSION_SECRET=<generate-with-openssl-rand-base64-32>
DATABASE_URL=<railway-postgres-url>
CORS_ORIGIN=https://your-frontend.vercel.app
CLIENT_ORIGIN=https://your-frontend.vercel.app
```

### Database

Railway will provide a `DATABASE_URL` when you add a PostgreSQL service. The app will:
- Auto-create the `users` table on first run
- Use PostgreSQL session store for production

### Session Cookies

In production with HTTPS:
- Cookies are `Secure` (HTTPS only)
- `SameSite=Lax` for CSRF protection
- `httpOnly` (not accessible via JavaScript)

## API Endpoints

### POST /api/auth/signup
Create a new account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name"
}
```

**Response:**
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

### POST /api/auth/login
Sign in.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
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

### POST /api/auth/logout
Sign out (destroys session).

**Response:**
```json
{
  "success": true,
  "message": "Signed out successfully"
}
```

### GET /api/auth/me
Get current user (requires authentication).

**Response:**
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

## Security Features

1. **Password Hashing**: Bcrypt with 12 rounds
2. **Rate Limiting**: 5 requests per 15 minutes on auth routes
3. **Email Enumeration Protection**: Generic error messages
4. **Session Security**: HTTP-only, secure cookies
5. **Input Validation**: Email format, password strength

## Frontend Integration

The frontend uses `useAuth()` composable:

```javascript
import { useAuth } from '@/composables/useAuth';

const { user, loading, login, signup, logout, loadUser } = useAuth();

// Load user on app start
await loadUser();

// Sign up
await signup(email, password, name);

// Sign in
await login(email, password);

// Sign out
await logout();
```

All API calls automatically include `credentials: 'include'` to send session cookies.
