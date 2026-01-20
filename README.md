# AgoraX - Digital Democracy Platform

A comprehensive digital democracy platform built for Greek citizens to participate in transparent and reliable voting processes. The platform combines modern web technologies with location-based features to enable community-driven decision-making through polls, surveys, and discussions.

## Features

### Poll Management
- **Standard Polls**: Simple voting with multiple choice options and ranking support
- **Survey Polls**: Complex questionnaires with multi-step voting interface
  - Three question types: single choice, multiple choice, ordering/ranking
  - Conditional/branching questions based on previous answers
  - Progress tracking through multi-question surveys
- Location-based restrictions with GPS geofencing
- Time-based poll scheduling and automatic expiration

### Location Services
- GPS-based user location detection and verification
- Reverse geocoding using OpenStreetMap Nominatim API
- Geographic region detection for Greek territories
- Geofenced poll participation based on coordinates

### Identity & Security
- **Unique Voter Verification**: Implements "One Account - One Person - One Vote" using government-issued documents.
- **Gov.gr Integration**: Validates digital signatures from the Greek government's Gov.gr portal to ensure authentic identities.
- **Solemn Declaration Verification**: Users must upload a digitally signed Solemn Declaration from Gov.gr to verify their identity.
- **Anti-Fraud**: Prevents duplicate voting by tracking the hashed TAX ID (AFM) from the uploaded PDF documents.

### Authentication
- **Local authentication** with secure password hashing
- **Google OAuth** integration
- **Session-based authentication** with secure cookies
- **Role-based access control** (admin/user roles)

### Content Management
- Rich text content creation with TipTap editor
- Comment system with threaded discussions
- File upload and image processing

### Analytics & Reporting
- Comprehensive analytics dashboard for platform insights
- User engagement tracking and statistics
- Poll popularity and participation metrics
- Activity trend analysis with visual charts

## Tech Stack

### Frontend
- **Framework**: React with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack Query
- **UI Components**: Radix UI primitives with Tailwind CSS
- **Form Handling**: React Hook Form with Zod validation
- **Rich Text**: TipTap editor
- **Maps**: Leaflet with OpenStreetMap

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **ORM**: Drizzle ORM
- **Database**: PostgreSQL
- **Authentication**: Passport.js

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database

### Environment Variables

Create a `.env` file with the following variables:

```env
DATABASE_URL=your_postgresql_connection_string
SESSION_SECRET=your_session_secret
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
```

### Installation

```bash
# Install dependencies
npm install

# Push database schema
npm run db:push

# Start development server
npm run dev
```

The application will be available at `http://localhost:5000`.

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility functions
│   │   ├── pages/         # Page components
│   │   └── App.tsx        # Main application entry
├── server/                 # Backend Express application
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Database operations
│   ├── auth.ts            # Authentication configuration
│   └── utils/
│       └── ballot-client.ts # Client for Python Ballot Service
├── ballot_service/         # Python FastAPI Service for Ballot Validation
│   ├── main.py            # Service entry point
│   ├── validator.py       # validation logic
│   └── requirements.txt   # Python dependencies
├── shared/                 # Shared code between frontend and backend
│   └── schema.ts          # Database schema and types
└── package.json

## Ballot Service (Python)

The platform includes a dedicated microservice for validating Gov.gr PDF ballots using digital signature verification.

### Prerequisites (Python)
- Python 3.10+
- pip (Python package manager)

### Installation

```bash
cd ballot_service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Running the Service

```bash
# Activation is required first
source venv/bin/activate

# Run the server
uvicorn main:app --reload --port 8001
```

The service will run at `http://localhost:8001`. The main Node.js application expects this service to be running for PDF validation features to work.

```

## License

This project is proprietary software.

## Contributing

Contributions are welcome. Please open an issue or submit a pull request.
