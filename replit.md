# Dr Crop - Plant Disease Diagnostics

## Overview

Dr Crop is a modern web application designed for agricultural professionals to diagnose plant diseases through image analysis. The application allows users to upload or capture plant images, processes them using AI simulation, and provides comprehensive diagnostic information including disease identification, severity assessment, and both organic and chemical treatment recommendations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript for type safety and modern development practices
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management and caching
- **UI Components**: Shadcn/ui component library built on Radix UI primitives for accessible, customizable components
- **Styling**: Tailwind CSS with custom design tokens for consistent theming
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework for RESTful API endpoints
- **Language**: TypeScript for full-stack type safety
- **File Handling**: Multer middleware for image upload processing with validation
- **API Design**: RESTful endpoints for image analysis and data retrieval
- **Error Handling**: Centralized error handling middleware with structured error responses

### Data Storage Solutions
- **Database**: PostgreSQL configured with Drizzle ORM for type-safe database operations
- **Database Provider**: Neon serverless PostgreSQL for scalable cloud hosting
- **Schema Management**: Drizzle Kit for database migrations and schema versioning
- **File Storage**: Local file system storage for uploaded images with configurable upload directory

### Authentication and Authorization
- **Current State**: In-memory storage implementation for development
- **Planned**: Session-based authentication with user management
- **Data Models**: User and analysis schemas defined with proper relationships

### Image Processing Pipeline
- **Upload Validation**: File type and size restrictions (JPEG/PNG, 10MB limit)
- **Camera Integration**: Web API camera access with mobile-optimized capture
- **Analysis Simulation**: Mock disease detection with randomized but realistic results
- **Response Format**: Structured JSON with disease name, severity percentage, and treatment recommendations

### Monorepo Structure
- **Shared Schema**: Common TypeScript types and Zod validation schemas
- **Client-Server Separation**: Clean separation between frontend and backend code
- **Path Aliases**: Configured import aliases for clean code organization
- **Development Workflow**: Hot reload and development tools integrated

## External Dependencies

### Database and ORM
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Drizzle ORM**: Type-safe database operations with schema validation
- **Drizzle Kit**: Database migration and schema management tools

### UI and Styling
- **Radix UI**: Accessible component primitives for complex UI elements
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **Shadcn/ui**: Pre-built component library with consistent design patterns
- **Lucide React**: Icon library for consistent iconography

### Development Tools
- **Vite**: Fast build tool with hot module replacement
- **TypeScript**: Static typing for improved developer experience
- **ESBuild**: Fast bundling for production builds
- **PostCSS**: CSS processing with Tailwind integration

### Runtime Libraries
- **TanStack Query**: Server state management with caching and synchronization
- **React Hook Form**: Form handling with validation
- **Zod**: Runtime type validation and schema definition
- **Date-fns**: Date manipulation utilities
- **Wouter**: Lightweight routing solution

### File Processing
- **Multer**: Express middleware for handling multipart/form-data
- **Image Validation**: Built-in file type and size validation

### Development Environment
- **Replit Integration**: Platform-specific development tools and error handling
- **Environment Variables**: Database connection and configuration management