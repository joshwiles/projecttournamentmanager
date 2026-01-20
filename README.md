# Vue.js + Express.js Full-Stack Template

A clean, minimal full-stack template for building modern web applications with Vue.js frontend and Express.js backend.

## 🚀 Features

### Frontend (Vue.js 3)
- **Vue 3** with Composition API
- **Vite** for fast development and building
- **Tailwind CSS** for utility-first styling
- **PostCSS** for CSS processing
- **Modern tooling** with hot module replacement

### Backend (Express.js)
- **Express.js** - Fast, unopinionated web framework
- **Security** - Helmet.js for security headers
- **CORS** - Cross-origin resource sharing support
- **Logging** - Morgan for HTTP request logging
- **Environment** - Dotenv for environment variables
- **Error Handling** - Centralized error handling middleware

## 📁 Project Structure

```
├── frontend/          # Vue.js frontend application
│   ├── src/
│   │   ├── App.vue   # Main application component
│   │   ├── main.js   # Application entry point
│   │   ├── assets/   # Static assets and styles
│   │   └── components/ # Vue components
│   ├── package.json  # Frontend dependencies
│   └── README.md     # Frontend documentation
├── backend/           # Express.js backend API
│   ├── server.js     # Main server file
│   ├── routes/       # API routes
│   ├── middleware/   # Custom middleware
│   ├── utils/        # Utility functions
│   ├── tests/        # Test files
│   ├── package.json  # Backend dependencies
│   └── README.md     # Backend documentation
└── README.md         # This file
```

## 🛠️ Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

1. Clone this template:
```bash
git clone <your-repo-url>
cd vue-express-template
```

2. Install frontend dependencies:
```bash
cd frontend
npm install
```

3. Install backend dependencies:
```bash
cd ../backend
npm install
cp env.example .env
```

4. Start both servers:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Backend will be available at: http://localhost:3000

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Frontend will be available at: http://localhost:5173

## 📋 Available Scripts

### Frontend
- `npm run dev` - Start development server (http://localhost:5173)
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Backend
- `npm run dev` - Start development server with nodemon (http://localhost:3000)
- `npm start` - Start production server
- `npm test` - Run tests

## 🔐 Authentication

The app includes a complete authentication system:

- **Sign Up**: Create new accounts
- **Sign In**: Login with email/password
- **Session Management**: Secure cookie-based sessions
- **Protected Routes**: Require authentication

### Quick Setup

1. **Backend**: Set `SESSION_SECRET` in `.env`:
   ```bash
   cd backend
   cp env.example .env
   # Generate secret: openssl rand -base64 32
   # Add to .env: SESSION_SECRET=your-secret
   ```

2. **Frontend**: Already configured to use session cookies

See [backend/AUTH_SETUP.md](backend/AUTH_SETUP.md) for detailed documentation.

## 🔧 API Endpoints

- `GET /` - Welcome message
- `GET /health` - Health check
- `GET /api/example` - Example API endpoint

## 🎨 Customization

This template provides a minimal starting point. You can:

### Frontend
- Add your own components in `frontend/src/components/`
- Customize styling in `frontend/src/assets/main.css`
- Modify layout in `frontend/src/App.vue`
- Add routing with `vue-router`
- Add state management with `pinia`

### Backend
- Add your own routes in `backend/routes/`
- Create custom middleware in `backend/middleware/`
- Add database connections and models
- Implement authentication and authorization
- Add validation and sanitization

## 🚀 Building for Production

### Frontend
```bash
cd frontend
npm run build
```
Built files will be in `frontend/dist/`

### Backend
```bash
cd backend
npm start
```

## 📚 Documentation

- [Frontend README](frontend/README.md) - Detailed frontend setup and usage
- [Backend README](backend/README.md) - Detailed backend setup and usage

## 📄 License

MIT
