# CivicShield

CivicShield is a React + TypeScript web application focused on digital safety. It helps users analyze suspicious messages, check risky job offers, generate complaint templates, and track scam-related alerts.

## Project Owner

- Name: Alane Mohan
- Email: alanemohan@gmail.com

## Key Features

- AI-powered scam message analysis
- Job offer risk checks
- Complaint generator and status tracking
- Authority finder for reporting guidance
- Community alerts and watchlist monitoring
- Vulnerability profile and personalized recommendations
- Multi-language support for analysis output

## Tech Stack

- Vite
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase (Auth, DB, Edge Functions)

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```sh
npm install
```

### Run in Development

```sh
npm run dev
```

### Build for Production

```sh
npm run build
```

### Preview Production Build

```sh
npm run preview
```

### Run Tests

```sh
npm run test
```

## Project Structure

```text
src/
  components/       # Shared UI and feature components
  contexts/         # React context providers
  hooks/            # Custom hooks
  integrations/     # Supabase client/integrations
  lib/              # Utility and export helpers
  pages/            # App pages/routes
supabase/
  functions/        # Edge functions for analysis/generation
  migrations/       # Database migrations
```

## Contact

For collaboration, support, or project questions:

- Alane Mohan
- alanemohan@gmail.com
