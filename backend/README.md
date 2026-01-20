# Express.js Backend Template

A clean, minimal Express.js backend template for building RESTful APIs.

## Features

- **Express.js** - Fast, unopinionated web framework
- **Security** - Helmet.js for security headers
- **CORS** - Cross-origin resource sharing support
- **Logging** - Morgan for HTTP request logging
- **Environment** - Dotenv for environment variables
- **Error Handling** - Centralized error handling middleware

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment file:
```bash
cp env.example .env
```

3. Start development server:
```bash
npm run dev
```

4. Your API will be available at `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm test` - Run tests

## Project Structure

```
backend/
├── server.js          # Main server file
├── package.json       # Dependencies and scripts
├── env.example        # Environment variables template
├── nodemon.json       # Development configuration
├── routes/            # API routes (create your own)
├── middleware/        # Custom middleware (create your own)
├── utils/             # Utility functions (create your own)
└── tests/             # Test files (create your own)
```

## API Endpoints

- `GET /` - Welcome message
- `GET /health` - Health check
- `GET /api/example` - Example API endpoint

## Customization

This template provides a minimal starting point. You can:

- Add your own routes in the `routes/` directory
- Create custom middleware in the `middleware/` directory
- Add database connections and models
- Implement authentication and authorization
- Add validation and sanitization
- Create comprehensive test suites

## Environment Variables

Copy `env.example` to `.env` and configure:

### Required Variables

- `SESSION_SECRET` - **REQUIRED** - Secret key for session encryption. Generate with: `openssl rand -base64 32`
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `CORS_ORIGIN` - Allowed origin for CORS (e.g., `https://your-frontend.vercel.app`)

### Optional Variables

- `DATABASE_URL` - PostgreSQL connection string (for production). If not set, uses SQLite locally.
- `CLIENT_ORIGIN` - Frontend URL for cookie settings (defaults to CORS_ORIGIN)
- `DB_PATH` - Path to SQLite database file (default: `./dev.db`)

## Authentication

The app includes a complete authentication system:

- **Sign Up**: Create new user accounts
- **Sign In**: Login with email/password
- **Session Management**: Secure cookie-based sessions
- **Password Security**: Bcrypt hashing with 12 rounds
- **Rate Limiting**: Auth routes are rate-limited (5 requests per 15 minutes)
- **Input Validation**: Email format, password strength (min 8 chars)

### Database

- **Production**: Uses PostgreSQL (set `DATABASE_URL`)
- **Development**: Uses SQLite (`dev.db` file, auto-created)

### Session Security

- Sessions stored in secure HTTP-only cookies
- 7-day expiration
- SameSite=Lax for CSRF protection
- Secure flag enabled in production (HTTPS required)

## License

MIT
