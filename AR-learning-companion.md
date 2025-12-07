# AR-Powered Contextual Learning Companion

## Overview

This is an AR-powered educational platform that enables students to scan textbooks, extract and enhance learning concepts with AI, visualize them in augmented reality, and test their knowledge through interactive quizzes. The application combines modern web technologies with a gamified learning approach inspired by Duolingo, featuring clean information hierarchy and achievement-focused visual feedback.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript, using Vite as the build tool and development server.

**Routing**: Wouter for lightweight client-side routing with protected route patterns to enforce authentication.

**State Management**: 
- TanStack Query (React Query) for server state management with caching and invalidation strategies
- React Context API for theme management (light/dark mode toggle)
- Session-based authentication state managed through API queries

**UI Component System**:
- Shadcn/ui component library with Radix UI primitives for accessible, unstyled components
- Tailwind CSS for utility-first styling with custom design tokens
- Custom CSS variables for theme switching and consistent color palette
- Design system inspired by Duolingo (gamification), Notion (hierarchy), and Linear (typography)

**Typography**:
- Inter font family for body text and UI elements
- Space Grotesk for headings and display text
- Consistent type scale from text-xs to text-7xl

**Key Design Principles**:
- Progressive disclosure of complex features
- Spatial consistency for reduced cognitive load
- Achievement-focused visual feedback
- Scannable information hierarchy

### Backend Architecture

**Runtime**: Node.js with Express.js framework running in ESM module mode.

**API Design**: RESTful HTTP endpoints with JSON request/response format.

**Session Management**:
- Express-session middleware with PostgreSQL session store (connect-pg-simple)
- HTTP-only cookies for session tokens
- 7-day session expiration
- Secure cookie settings in production environment

**Authentication**:
- Username/password-based authentication
- Bcrypt for password hashing with 10 salt rounds
- Session-based user identification via `req.session.userId`
- Protected routes check session state before serving data

**Database Layer**:
- Drizzle ORM for type-safe database operations
- Neon serverless PostgreSQL with WebSocket connection pooling
- Schema-first approach with TypeScript type inference
- Migration management via drizzle-kit

### Data Storage Solutions

**Database**: PostgreSQL (provisioned via Neon serverless platform)

**Schema Design**:
- `users` table: User accounts with authentication credentials, profile data (full name, email, avatar), and learning preferences
- `scanned_content` table: OCR-extracted text from scanned textbooks with associated metadata and extracted concepts
- `concepts` table: Learning concepts with definitions, categories, difficulty levels, related concepts array, and multimedia resources (JSONB)
- `quizzes` table: Quiz instances linked to users and concepts, containing questions (JSONB), scores, and completion status
- `learning_progress` table: Tracks user progress across concepts

**Key Design Decisions**:
- UUID primary keys using PostgreSQL's `gen_random_uuid()` for distributed system compatibility
- JSONB columns for flexible storage of questions and multimedia resources
- Array columns for related concepts and concept lists
- Timestamp tracking with `defaultNow()` for auditing

### Authentication and Authorization

**Authentication Flow**:
1. User submits credentials via `/api/auth/login` or `/api/auth/signup`
2. Server validates credentials (checks existing user, verifies password hash)
3. On success, session is created with `userId` stored in `req.session`
4. Session cookie is sent to client for subsequent requests
5. Protected routes verify `req.session.userId` exists

**Authorization Pattern**:
- Frontend ProtectedRoute component checks authentication status via `/api/auth/me` endpoint
- Shows loading state during authentication check
- Redirects to `/login` if unauthenticated
- Session persists across page refreshes via cookie

**Security Measures**:
- Passwords never returned in API responses (filtered out before sending)
- HTTP-only cookies prevent JavaScript access
- Secure flag enabled in production
- CSRF protection via session-based architecture

### External Dependencies

**UI Component Libraries**:
- Radix UI primitives (accordion, alert-dialog, avatar, checkbox, dialog, dropdown-menu, etc.)
- All Radix components provide accessible, unstyled foundations

**Styling and Theming**:
- Tailwind CSS with PostCSS for utility-first styling
- class-variance-authority for component variant management
- clsx and tailwind-merge for conditional class composition
- Google Fonts (Inter, Space Grotesk)

**Form Management**:
- react-hook-form for form state management
- @hookform/resolvers with Zod for schema validation

**Data Fetching**:
- @tanstack/react-query for server state synchronization
- Custom queryClient with fetch-based implementation

**Date Handling**:
- date-fns for date manipulation and formatting

**Development Tools**:
- Vite plugins for development: runtime-error-modal, cartographer (Replit-specific), dev-banner
- TypeScript for type safety across frontend and backend
- TSX for running TypeScript server code in development
- esbuild for production server bundling

**Planned Integrations** (marked with TODO comments in code):
- OCR/Camera integration for scanning textbook pages
- AR visualization library (AR.js or model-viewer suggested in comments)
- Graph visualization library for knowledge graph (react-force-graph, vis-network, or cytoscape suggested)
- AI service for concept enhancement and quiz generation

**Database Tooling**:
- @neondatabase/serverless for PostgreSQL connectivity
- drizzle-orm for type-safe queries
- drizzle-kit for schema migrations and database management
- drizzle-zod for generating Zod schemas from database schema

**Notable Architectural Patterns**:
- Shared schema definitions between frontend and backend via `shared/schema.ts`
- Path aliases (`@/`, `@shared/`, `@assets/`) for clean imports
- Mock data patterns throughout frontend pages (marked with TODO for backend integration)
- Middleware-based request logging with timing information
- Separation of storage layer (DatabaseStorage class) from route handlers for testability