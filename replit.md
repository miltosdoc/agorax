# AgoraX - Digital Democracy Platform

## Overview

AgoraX is a comprehensive digital democracy platform built for Greek citizens to participate in transparent and reliable voting processes. The platform combines modern web technologies with location-based features to enable community-driven decision-making through polls, surveys, and discussions.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state, React Context for authentication
- **UI Components**: Custom component library built with Radix UI primitives
- **Styling**: Tailwind CSS with a professional theme system
- **Form Handling**: React Hook Form with Zod validation
- **Rich Text**: TipTap editor for content creation
- **Mapping**: Leaflet for interactive maps and geofencing
- **Internationalization**: Custom translation system (Greek/English)

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **Authentication**: Passport.js with local and Google OAuth strategies
- **Session Management**: Express sessions with PostgreSQL store
- **File Processing**: Built-in image processing for Open Graph images

### Build System
- **Bundler**: Vite for frontend development and building
- **Backend Bundler**: ESBuild for production server bundling
- **Development**: Hot module replacement and TypeScript checking

## Key Components

### Authentication System
- Local authentication with hashed passwords (scrypt)
- Google OAuth integration
- Session-based authentication with secure cookies
- Role-based access control (admin/user roles)

### Poll Management
- **Standard Polls**: Simple voting with multiple choice options and ranking support
- **Survey Polls**: Complex questionnaires with multi-step voting interface
  - Three question types: single choice, multiple choice, ordering/ranking
  - Conditional/branching questions based on previous answers
  - Progress tracking through multi-question surveys
  - Auto-initialization of ordering questions with default order
  - Comprehensive validation for required questions
- Location-based restrictions with GPS geofencing for all poll types
- Time-based poll scheduling and automatic expiration
- Poll extension capabilities for active polls
- Dedicated results modals for both standard and survey polls

### Location Services
- GPS-based user location detection and verification
- Reverse geocoding using OpenStreetMap Nominatim API
- Geographic region detection for Greek territories
- Geofenced poll participation based on coordinates
- Manual location verification for edge cases

### Content Management
- Rich text content creation with TipTap editor
- HTML content sanitization and rendering
- Comment system with threaded discussions
- File upload and image processing capabilities

### Analytics & Reporting
- Comprehensive analytics dashboard for platform insights
- User engagement tracking and statistics
- Poll popularity and participation metrics
- Activity trend analysis with visual charts

## Data Flow

### User Registration & Authentication
1. User registers with email/password or Google OAuth
2. Location detection prompts for GPS coordinates
3. Reverse geocoding determines geographic eligibility
4. Session established with secure cookie storage

### Poll Participation
1. User browses available polls with location filtering
2. Location eligibility verification for geofenced polls
3. Vote submission with validation and duplicate prevention
4. Real-time results updates and comment participation

### Poll Creation
1. Authenticated users create polls with rich content editor
2. Location scope configuration (global/geofenced)
3. Time scheduling and duration settings
4. Automatic activation and notification systems

### Data Persistence
1. All data stored in PostgreSQL with Drizzle ORM
2. Session data managed in database store
3. File uploads handled with server-side processing
4. Database migrations managed through Drizzle Kit

## External Dependencies

### Core Infrastructure
- **Database**: PostgreSQL (configured for Neon serverless)
- **Session Store**: PostgreSQL-based session storage
- **Authentication**: Google OAuth API integration

### Third-Party Services
- **Geocoding**: OpenStreetMap Nominatim API for location services
- **Maps**: Leaflet with OpenStreetMap tiles
- **Fonts**: Google Fonts (Open Sans, Roboto)

### Development Tools
- **Package Manager**: NPM with lockfile dependency management
- **TypeScript**: Strict type checking across frontend and backend
- **Linting**: Built-in TypeScript compiler checking

## Deployment Strategy

### Development Environment
- Local development with hot reload via Vite
- PostgreSQL database connection via environment variables
- Session secrets and OAuth credentials via environment configuration

### Production Build
- Frontend built to static assets via Vite
- Backend bundled with ESBuild for Node.js deployment
- Single-server deployment with static file serving
- Database migrations applied via Drizzle push commands

### Platform Configuration
- Replit deployment with auto-scaling capabilities
- PostgreSQL module integration for database provisioning
- Port configuration for HTTP traffic (5000 → 80)
- Build and start scripts for automated deployment

## Changelog
- October 16, 2025: Fixed survey poll data integrity issues
  - **Data Migration**: Successfully migrated 41 legacy multiple choice responses from answerValue JSON arrays to normalized answerId records (601 total responses now normalized)
  - **Edit Protection**: Implemented split update logic - updateSurveyMetadata allows safe edits (title, description, category, dates), updateSurveyStructure blocked after first response to prevent breaking referential integrity
  - **Backend Validation**: Added validation to reject responses missing both answerId and answerValue, preventing future data corruption (uses loose equality == to catch null/undefined)
  - **Frontend Warning**: Added prominent warning banner in survey edit form showing response count and explaining editing restrictions when survey has responses
  - **Results Fix**: Updated getSurveyResults SQL query to handle both answerId field and answerValue JSONB arrays for all question types (single choice, multiple choice, ordering)
  - **Error Messaging**: Backend returns clear Greek error message when structural edits are blocked: "Δεν μπορείτε να τροποποιήσετε τις ερωτήσεις ή απαντήσεις αφού έχουν υποβληθεί απαντήσεις"
- October 2, 2025: Implemented complete survey poll voting system
  - Created SurveyVoteModal with progress tracking and multi-step navigation
  - Added support for conditional/branching questions based on parent answers
  - Implemented automatic ordering question initialization
  - Created SurveyResultsModal for displaying survey results with question type-specific visualizations
  - Updated poll-card and poll-details components to handle both standard and survey polls
  - Made RankingVote component generic to work with both poll options and survey answers
  - Added comprehensive Greek translations for survey voting interface
  - Fixed index drift and stale response cleanup in conditional question flows
  - Customized survey poll button text to "Ψηφίστε στην δημοσκόπηση" (Vote in the Survey)
  - Fixed vote count synchronization for survey polls - enrichPoll now correctly counts from pollUserResponses table
  - Fixed duplicate ID error when creating surveys by excluding temporary IDs from database inserts
  - Enhanced button layout for survey polls - vote button now on separate full-width row
- June 15, 2025: Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.