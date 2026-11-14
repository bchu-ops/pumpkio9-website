# SpeedDemon Frontend

<!-- Purpose: Add your purpose statement here -->

## Overview

React + Vite + JavaScript frontend application for the SpeedDemon kart racing optimization platform.

This frontend provides a modern, responsive user interface for interacting with the SpeedDemon backend API. It's built with React 19 and uses Vite for fast development and building.

## Prerequisites

- **Node.js**: Version 18.0 or higher
- **npm**: Version 9.0 or higher (comes with Node.js)

## Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

This will install all required packages listed in `package.json` and generate `package-lock.json`.

## Running the Application

### Option 1: Using Docker (Recommended)

From the project root:

```bash
# Build the frontend image
make frontend-build

# Start frontend only (detached)
make frontend-up

# Start frontend in development mode (foreground with logs)
make dev-frontend

# Start frontend and backend together
make dev frontend backend

# ═══════════════════════════════════════════════════════════════
# VIEW YOUR SERVICES AT (LOCAL DEVELOPMENT):
# ═══════════════════════════════════════════════════════════════
# FRONTEND (UI):    http://localhost:3000
# ═══════════════════════════════════════════════════════════════
```

### Option 2: Local Development (Without Docker)

**Requirements:**
- Node.js 18.0+
- npm 9.0+

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# ═══════════════════════════════════════════════════════════════
# VIEW YOUR SERVICES AT (LOCAL DEVELOPMENT):
# ═══════════════════════════════════════════════════════════════
# FRONTEND (UI):    http://localhost:3000
# ═══════════════════════════════════════════════════════════════
```

The development server includes:
- **Hot Module Replacement (HMR)**: Changes to files are instantly reflected in the browser
- **Fast Refresh**: React components update without losing state
- **API Proxy**: Requests to `/api/*` are automatically proxied to `http://localhost:8000`

### Production Build

Build the application for production:

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

### Preview Production Build

Preview the production build locally:

```bash
npm run preview
```

### GitHub Pages Deployment

The frontend is automatically deployed to GitHub Pages on push to `main` branch.

**Base Path Configuration:**
- The base path is automatically configured in `vite.config.js` based on your repository name
- For project pages: `/speeddemon/` (matches your repo name)
- For user/org pages: `/` (if using `username.github.io`)

**Deployed URL:**
```
═══════════════════════════════════════════════════════════════
VIEW YOUR DEPLOYED WEBSITE (GITHUB PAGES):
═══════════════════════════════════════════════════════════════
PRODUCTION SITE:  https://bchu-ops.github.io/speeddemon/
═══════════════════════════════════════════════════════════════
```

**How Base Path Works:**
- **Local Development**: Base path is `/` (root)
- **Docker Development**: Base path is `/` (root)
- **GitHub Pages Production**: Base path is `/speeddemon/` (auto-detected from `GITHUB_REPOSITORY` env var)

The base path is set automatically during the GitHub Actions build process. No manual configuration needed.

## How It Works

### Architecture

The frontend follows a component-based architecture:

- **Components**: Reusable UI elements (Header, Footer)
- **Pages**: Full page components (Home)
- **Services**: API client functions for backend communication
- **Styles**: CSS files organized by component/page

### API Integration

The frontend communicates with the backend API through the `src/services/api.js` module. All API calls are proxied through Vite's development server:

- Development: `/api/*` → `http://localhost:8000/*`
- Production: Configure `VITE_API_URL` environment variable

### State Management

Currently uses React's built-in `useState` hook for local component state. The application is structured to easily integrate state management libraries (Redux, Zustand, etc.) if needed in the future.

### Styling

- **CSS Variables**: Global design tokens defined in `src/index.css`
- **Component Styles**: Each component has its own CSS file
- **Responsive Design**: Mobile-first approach with media queries

## File Structure

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Header.jsx       # Main navigation header
│   │   ├── Header.css       # Header styles
│   │   ├── Footer.jsx       # Footer component
│   │   └── Footer.css       # Footer styles
│   ├── pages/               # Page components
│   │   ├── Home.jsx         # Homepage
│   │   └── Home.css         # Homepage styles
│   ├── services/            # API client functions
│   │   └── api.js           # Backend API integration
│   ├── App.jsx              # Main app component
│   ├── App.css               # App-level styles
│   ├── main.jsx              # React entry point
│   └── index.css             # Global styles and CSS variables
├── reports/                  # Reports directory (preserved)
│   └── .gitkeep             # Keeps directory in git
├── index.html                # HTML entry point
├── vite.config.js            # Vite configuration (includes base path for GitHub Pages)
├── package.json              # Dependencies and scripts
├── package-lock.json         # Locked dependency versions
├── .gitignore               # Git ignore rules
└── README.md                 # This file
```

**Key Configuration:**
- **`vite.config.js`**: Configures base path for GitHub Pages (`/speeddemon/`), development server settings, and API proxy
- **Base Path**: Automatically set to `/speeddemon/` for GitHub Pages production builds, `/` for local/Docker development

## Required Packages

### Dependencies

- **react** (^19.0.0): React library for building user interfaces
- **react-dom** (^19.0.0): React DOM renderer

### Dev Dependencies

- **@vitejs/plugin-react** (^4.2.1): Vite plugin for React support
- **vite** (^5.0.0): Next-generation frontend build tool

## Environment Variables

Create a `.env` file in the frontend directory to configure:

```env
# Backend API URL (for production)
VITE_API_URL=http://localhost:8000
```

In development, the proxy configured in `vite.config.js` handles API routing automatically.

**Base Path Configuration:**
The base path for GitHub Pages is configured in `vite.config.js`:
- **Local/Docker Development**: `/` (root path)
- **GitHub Pages Production**: `/speeddemon/` (auto-detected from repository name)
- The base path is automatically set during GitHub Actions builds via `GITHUB_REPOSITORY` environment variable

## Development Workflow

### Using Docker (Recommended)

```bash
# From project root
# Start frontend and backend together
make dev frontend backend

# Or start frontend only
make dev-frontend

# View logs
make logs

# Stop services
make dev-down
```

### Local Development

1. **Start Backend**: Ensure the backend is running on `http://localhost:8000`
2. **Start Frontend**: Run `npm run dev` in the frontend directory
3. **Make Changes**: Edit files in `src/` - changes will hot-reload automatically
4. **Test API**: Use the "Check Backend Health" button on the homepage to verify backend connectivity

**Access:**
```
═══════════════════════════════════════════════════════════════
VIEW YOUR SERVICES AT (LOCAL DEVELOPMENT):
═══════════════════════════════════════════════════════════════
FRONTEND (UI):    http://localhost:3000
═══════════════════════════════════════════════════════════════
```

## Features

- ✅ Modern React 19 with hooks
- ✅ Fast development with Vite HMR
- ✅ Responsive design (mobile-friendly)
- ✅ API client ready for backend integration
- ✅ Clean component structure
- ✅ CSS variables for theming
- ✅ Production-ready build configuration

## Future Enhancements

- Add routing (React Router) for multiple pages
- Integrate state management library if needed
- Add form validation library
- Implement authentication flow
- Add error boundaries
- Set up testing framework (Vitest, React Testing Library)

## Troubleshooting

### Port Already in Use

If port 3000 is already in use:

**Docker:**
```bash
# Stop other containers using the port
docker ps | grep 3000
docker stop <container-name>

# Or use make to stop all SpeedDemon services
make dev-down
```

**Local:**
```bash
# Vite will automatically try the next available port, or specify:
npm run dev -- --port 3001
```

### Backend Not Connecting

1. Verify backend is running: `curl http://localhost:8000/health`
2. Check `vite.config.js` proxy configuration:
   - Development: `/api/*` → `http://localhost:8000/*`
   - Docker: `/api/*` → `http://backend:8000/*` (uses service name)
3. Ensure CORS is enabled on the backend

### Dependencies Issues

**Docker:**
```bash
# Rebuild the frontend image
make frontend-build
```

**Local:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Base Path Issues (GitHub Pages)

If assets fail to load on GitHub Pages:
1. Check the GitHub Actions workflow logs for the base path used
2. Verify `vite.config.js` is detecting `GITHUB_REPOSITORY` correctly
3. Ensure the repository name matches the base path (case-sensitive)
4. The base path should be `/speeddemon/` (lowercase) for this repository

## Contributing

When adding new features:

1. Follow the existing file structure
2. Create component-specific CSS files
3. Add API functions to `src/services/api.js`
4. Update this README if adding new dependencies or features

## License

This project is for educational and research purposes.
