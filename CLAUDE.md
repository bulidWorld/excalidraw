# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

Excalidraw is a **monorepo** with a clear separation between the core library and the application:

- **`packages/excalidraw/`** - Main React component library published to npm as `@excalidraw/excalidraw`
- **`excalidraw-app/`** - Full-featured web application (excalidraw.com) that uses the library
- **`packages/`** - Core packages: `@excalidraw/common`, `@excalidraw/element`, `@excalidraw/math`, `@excalidraw/utils`
- **`examples/`** - Integration examples (NextJS, browser script)
- **`server/`** - Express backend for saving/loading diagrams
- **`dev-docs/`** - Development documentation

## Development Workflow

1. **Package Development**: Work in `packages/*` for editor features that should be published to npm
2. **App Development**: Work in `excalidraw-app/` for app-specific features (collaboration, storage, etc.)
3. **Testing**: Always run `yarn test:update` before committing to update snapshots
4. **Type Safety**: Use `yarn test:typecheck` to verify TypeScript - the project uses strict configuration
5. **Code Quality**: Run `yarn fix` before committing to auto-fix formatting and linting

## Development Commands

### Testing & Quality
```bash
yarn test:typecheck  # TypeScript type checking
yarn test:update     # Run all tests (with snapshot updates)
yarn test:server     # Run server API tests only
yarn test:app        # Run app tests with watch mode
yarn test:all        # Run all tests (typecheck + code + other + app + server)
yarn test            # Run app tests
yarn test:coverage   # Run tests with coverage report
yarn fix             # Auto-fix formatting and linting issues
```

### Development & Building
```bash
yarn start           # Start app in development mode (http://localhost:3000)
yarn build           # Build app for production
yarn build:packages  # Build all packages for publishing
yarn build:preview   # Build and preview production build
```

### Running a Single Test
```bash
# Run specific test file
yarn test path/to/file.test.tsx

# Run tests in watch mode
yarn test:app

# Update snapshots for specific test
yarn test:update --testNamePattern="test name"
```

## Project Startup

### App Development Mode
```bash
# 1. Install dependencies
yarn install

# 2. Start development server
yarn start

# 3. Open browser
http://localhost:3000
```

### Server API Mode
```bash
# 1. Install server dependencies
cd server && npm install

# 2. Start server (default port: 3001)
npm start

# 3. Test API endpoints
curl http://localhost:3001/api/health
```

### Production Build
```bash
# Build app and packages
yarn build

# Start server
cd server && npm start
```

## Architecture Overview

### Technology Stack
- **Frontend**: React 19, Vite 5, TypeScript (strict), Radix UI, Jotai
- **Build Tools**: Vite (app), esbuild (packages)
- **Testing**: Vitest, jsdom, React Testing Library
- **Backend**: Express 4, Node.js
- **Package Management**: Yarn workspaces

### Monorepo Architecture
The project uses Yarn workspaces with path aliases configured in `vitest.config.mts`:
- `@excalidraw/excalidraw` → `packages/excalidraw/`
- `@excalidraw/common` → `packages/common/src/`
- `@excalidraw/element` → `packages/element/src/`
- `@excalidraw/math` → `packages/math/src/`
- `@excalidraw/utils` → `packages/utils/src/`

### Key Directories
```
packages/
├── common/       # Shared utilities and types
├── element/      # Element modeling and geometry logic
├── excalidraw/   # Main editor component (published to npm)
├── math/         # Mathematical operations and types
└── utils/        # General utilities

excalidraw-app/
├── components/   # App-specific React components
├── data/       # Data persistence and API calls
├── collab/     # Real-time collaboration features
└── tests/      # App-specific tests
```

## Server API

### File Structure
```
server/
├── server.js          # Express server with API endpoints
├── server.test.ts     # Server API tests
├── package.json       # Server dependencies
└── node_modules/      # Installed packages
```

### API Endpoints
- `GET /api/health` - Health check
- `POST /api/save` - Save diagram to server
- `GET /api/files` - List all saved diagrams
- `GET /api/files/:name` - Load diagram from server
- `DELETE /api/files/:name` - Delete diagram from server

### Storage
Default save directory: `/usr/local/lib/excalidram/`
File format: `.excalidraw` (JSON format)

## Development Guidelines

### Code Style & Patterns
- **TypeScript**: Strict mode enabled, prefer `const` and readonly where possible
- **React**: Functional components with hooks, keep components small and focused
- **Styling**: CSS modules for component styling
- **Naming**: PascalCase for components/interfaces, camelCase for functions/variables, ALL_CAPS for constants

### Testing Philosophy
- Unit tests for utilities and pure functions
- Integration tests for components
- Snapshot tests for UI components
- Always update snapshots when intentionally changing UI (`yarn test:update`)

### Git Workflow
- Main branch is `master`
- Create feature branches for new work
- Run `yarn test:all` before pushing
- Use `yarn fix` to auto-fix linting/formatting issues

### Performance Considerations
- Minimize re-renders in React components
- Use React.memo for expensive components
- Prefer immutable data structures
- Use optional chaining (`?.`) and nullish coalescing (`??`) operators

## Additional Resources

- **Documentation**: https://docs.excalidraw.com
- **Contributing Guide**: https://docs.excalidraw.com/docs/introduction/contributing
- **Examples**: Check `examples/` directory for integration patterns
- **Development Docs**: See `dev-docs/` for additional development documentation
