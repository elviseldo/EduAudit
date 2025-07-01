# SchoolAudit - Asset Management System

## Overview

SchoolAudit is a full-stack web application designed for school asset management and audit reporting. The system allows students to create audit reports for school assets (furniture, electronics, storage, infrastructure) and enables administrators to review and manage these reports. Built with modern web technologies, it features a React frontend with TypeScript, Express.js backend, and PostgreSQL database with Drizzle ORM.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite with custom configuration for development and production

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with JSON responses
- **Middleware**: Custom logging, error handling, and authentication middleware
- **Session Management**: Express sessions with PostgreSQL store

### Database Architecture
- **Database**: PostgreSQL (configured for Neon serverless)
- **ORM**: Drizzle ORM with TypeScript schema definitions
- **Migration**: Drizzle Kit for schema migrations
- **Connection**: Connection pooling with @neondatabase/serverless

## Key Components

### Authentication System
- **Provider**: Replit OIDC authentication
- **Strategy**: Passport.js with OpenID Connect
- **Session Storage**: PostgreSQL-backed sessions with connect-pg-simple
- **User Management**: Automatic user creation/updates on login
- **Authorization**: Role-based access (student/admin)

### Data Models
- **Users**: Profile information, roles, and authentication data
- **Audits**: Asset condition reports with metadata
- **Sessions**: Authentication session persistence

### User Interface Components
- **Student Dashboard**: View personal audit history and create new reports
- **Admin Dashboard**: Manage all audits with filtering and status updates
- **Audit Form**: Comprehensive form for asset condition reporting
- **Landing Page**: Authentication entry point

## Data Flow

1. **Authentication Flow**:
   - User accesses application → Redirected to Replit OIDC
   - Successful authentication → User profile created/updated
   - Session established → Role-based dashboard routing

2. **Audit Creation Flow**:
   - Student selects asset type → Audit form populated
   - Form submission → Validation → Database storage
   - Audit appears in student dashboard and admin queue

3. **Admin Review Flow**:
   - Admin views pending audits → Applies filters/search
   - Review action → Status update → Audit tracking updated

## External Dependencies

### Production Dependencies
- **Database**: @neondatabase/serverless for PostgreSQL connectivity
- **Authentication**: openid-client, passport for OIDC integration
- **UI Library**: @radix-ui components with shadcn/ui styling
- **Validation**: zod for schema validation, drizzle-zod for integration
- **State Management**: @tanstack/react-query for server state
- **Utilities**: date-fns, clsx, class-variance-authority

### Development Dependencies
- **Build Tools**: Vite, esbuild, TypeScript compiler
- **Database Tools**: drizzle-kit for migrations
- **Development Server**: tsx for TypeScript execution
- **Replit Integration**: Custom vite plugins for development experience

## Deployment Strategy

### Development Environment
- **Server**: Node.js development server with hot reload
- **Client**: Vite development server with HMR
- **Database**: Environment-based PostgreSQL connection
- **Authentication**: Replit OIDC with development domains

### Production Build
- **Client Build**: Vite production build to `dist/public`
- **Server Build**: esbuild bundle to `dist/index.js`
- **Asset Serving**: Express static middleware for built assets
- **Process Management**: Single Node.js process serving both API and static files

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string (required)
- **SESSION_SECRET**: Session encryption key (required)
- **ISSUER_URL**: OIDC provider URL (defaults to Replit)
- **REPLIT_DOMAINS**: Allowed domains for authentication
- **NODE_ENV**: Environment mode (development/production)

## Changelog
- July 01, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.