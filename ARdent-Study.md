# ARdent Study - AR-Powered Contextual Learning Companion

## Overview

ARdent Study is an educational platform that enables students to scan textbooks using OCR, extract and enhance learning concepts with AI, visualize knowledge in interactive graphs, view 3D/AR models of educational concepts, take quizzes, and track learning progress with spaced repetition algorithms. The platform combines augmented reality, artificial intelligence, and gamification to create an immersive learning experience.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React with TypeScript for type-safe component development
- Vite as the build tool and development server for fast compilation and hot module replacement
- ESM module system throughout the codebase

**Routing & Navigation**
- Wouter for lightweight client-side routing
- Protected routes that enforce authentication before rendering components
- Redirects to login page for unauthenticated users

**State Management Strategy**
- TanStack Query (React Query) for server state with automatic caching, refetching, and invalidation
- React Context API for theme management (light/dark mode)
- Session-based authentication state managed through API queries with `on401` error handling patterns
- Custom `getQueryFn` utility that handles 401 responses by either throwing or returning null

**UI Component System**
- Shadcn/ui component library built on Radix UI primitives for accessible, unstyled foundation components
- Tailwind CSS utility-first styling with custom design tokens and CSS variables
- Design system featuring:
  - Inter font for body text and UI elements
  - Space Grotesk for headings and display text
  - Consistent color palette with HSL values supporting both light and dark modes
  - Type scale from text-xs to text-7xl

**3D/AR Visualization**
- Three.js for rendering 3D models in the browser
- Custom geometry generation for educational models (e.g., parametric heart shape)
- Camera controls with zoom, rotation, and fullscreen capabilities
- Browser-based camera access for AR overlay features

**OCR & Text Processing**
- Tesseract.js for client-side OCR processing
- Image capture via camera or file upload
- Text extraction and concept identification pipeline

**Data Visualization**
- Recharts library for analytics dashboards
- Line charts, bar charts, pie charts, and area charts for learning metrics
- Interactive knowledge graph visualization with node filtering and zoom controls

**Progressive Web App Features**
- Service worker registration for offline capabilities
- Cache-first strategy for static assets
- Network-first with cache fallback for API requests

### Backend Architecture

**Runtime & Framework**
- Node.js with Express.js in ESM module mode
- TypeScript for type safety across server code
- Custom middleware for request logging with timing information

**Authentication & Session Management**
- Express-session with PostgreSQL session store (connect-pg-simple)
- Bcrypt for password hashing with configurable salt rounds (default: 10)
- Session cookies with 7-day expiration
- HTTP-only, secure cookies in production
- Session data stored in database for persistence across server restarts

**Database Layer**
- Drizzle ORM for type-safe database queries
- PostgreSQL as the primary database (Neon serverless)
- Schema definitions shared between frontend and backend via `@shared/schema`
- Database tables:
  - `users`: User accounts, authentication, and profiles
  - `scanned_content`: OCR results and extracted text
  - `concepts`: Learning concepts with definitions and metadata
  - `quizzes`: Quiz instances and questions
  - `learning_progress`: Spaced repetition tracking with mastery levels
- Auto-generated UUIDs for primary keys using `gen_random_uuid()`

**File Upload Handling**
- Multer middleware for multipart form data
- In-memory storage for image processing
- Support for both file uploads and base64-encoded images

**API Design Patterns**
- RESTful endpoints with JSON request/response format
- Consistent error handling with appropriate HTTP status codes
- Session userId extraction for authenticated endpoints
- Query parameter support for filtering and pagination

**Spaced Repetition Algorithm**
- SM-2 algorithm implementation for optimal review scheduling
- Interval calculations based on review count and mastery level
- Quality ratings (0-5) influence next review date
- Progressive intervals: 1, 3, 7, 14, 30, 60+ days

### FastAPI Backend (Alternative Implementation)

The repository includes a parallel FastAPI backend implementation with:

**Authentication**
- JWT token-based authentication using python-jose
- Bcrypt password hashing via passlib
- Bearer token authentication scheme

**Database**
- SQLAlchemy ORM with SQLite for local development
- Pydantic models for request/response validation
- Automatic database initialization on startup

**Neo4j Integration**
- Graph database driver for knowledge graph relationships
- Concept nodes with properties (id, name, definition)
- Relationship types for concept connections
- Depth-based graph traversal queries

**AI Service Abstraction**
- Pluggable OCR service with external API fallback to pytesseract
- OpenAI API integration for concept enhancement and quiz generation
- Mock implementations for testing without API keys

**Modular Route Structure**
- Separate routers for auth, OCR, quizzes, knowledge graph, and AI features
- Dependency injection for database sessions and authentication
- Consistent response models across endpoints

## External Dependencies

### Third-Party Services

**OpenAI API** (Optional)
- Purpose: AI-powered quiz question generation and concept explanations
- Model: GPT-5 (latest model released August 7, 2025)
- Fallback: Intelligent fallback quiz generation when API key not configured
- Usage: Enhancing learning concepts with real-world examples and generating quiz questions

## Recent Changes (December 2025)

All 11 planned improvements have been implemented:

1. **OpenAI GPT-5 Integration** - Quiz generation uses GPT-5 with proper JSON parsing and fallback
2. **AR Camera Overlay** - ARCameraView component with camera access and 3D overlay
3. **Enhanced OCR** - Tesseract.js with progress logging
4. **SM-2 Spaced Repetition** - Full algorithm in `/lib/spacedRepetition.ts`
5. **Educational 3D Models** - Multiple categories (Biology, Chemistry, Physics, Math, Astronomy)
6. **Mobile Responsive** - Tailwind responsive classes throughout
7. **Progress Analytics** - New Analytics page with Recharts visualization
8. **Social Features** - ShareModal and Leaderboard page
9. **Offline Support** - Service worker with caching strategies
10. **Export/Import** - Data backup functionality in Settings
11. **Multi-Language (i18n)** - 6 languages supported in Settings

**Neon Serverless PostgreSQL**
- Purpose: Primary database for user data, concepts, quizzes, and progress
- WebSocket connections via `@neondatabase/serverless` driver
- Connection pooling for efficient resource usage
- Environment variable: `DATABASE_URL`

**Neo4j Graph Database** (FastAPI backend)
- Purpose: Knowledge graph for concept relationships and collaborative learning
- Bolt protocol connections
- Configuration via environment variables: `NEO4J_URI`, `NEO4J_USER`, `NEO4J_PASSWORD`

### Frontend Libraries

**UI Components**
- Radix UI primitives: Full suite of accessible components (accordion, alert-dialog, avatar, checkbox, dialog, dropdown-menu, popover, select, slider, switch, tabs, toast, tooltip)
- Shadcn/ui: Pre-configured styled components
- Framer Motion: Animation library (implied by design guidelines)
- Lucide React: Icon library

**Utilities**
- Class Variance Authority: Component variant management
- clsx & tailwind-merge: Conditional className utilities
- React Hook Form with Zod resolvers: Form validation
- date-fns or similar for date manipulation

**Development Tools**
- Vite plugins for Replit integration (cartographer, dev banner, runtime error overlay)
- TypeScript compiler with strict mode
- Path aliases for clean imports (@/, @shared/, @assets/)

### Backend Libraries

**Express Ecosystem**
- express-session: Session management
- connect-pg-simple: PostgreSQL session store
- multer: File upload handling
- bcrypt: Password hashing

**Database & ORM**
- drizzle-orm: Type-safe database queries
- drizzle-kit: Schema migrations and push commands
- @neondatabase/serverless: PostgreSQL driver with WebSocket support

**FastAPI Ecosystem** (Alternative backend)
- FastAPI: Web framework with automatic API documentation
- Uvicorn: ASGI server
- SQLAlchemy: Database ORM
- python-jose: JWT token handling
- pytesseract: OCR fallback implementation
- neo4j: Graph database driver
- httpx: Async HTTP client for external API calls

### Build & Deployment

**Build Process**
- Vite for frontend bundling
- esbuild for backend bundling
- Output directory: `dist/public` for frontend, `dist/` for backend

**Environment Variables Required**
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Session encryption key
- `OPENAI_API_KEY`: (Optional) For AI features
- `NODE_ENV`: Environment mode (development/production)
- FastAPI backend also requires: `SECRET_KEY`, `NEO4J_URI`, `NEO4J_USER`, `NEO4J_PASSWORD`

**Scripts**
- `dev`: Development server with tsx
- `build`: Production build (frontend + backend)
- `start`: Production server
- `db:push`: Push schema changes to database