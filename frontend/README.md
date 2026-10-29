# AttendAI — Frontend Foundation (Milestone 1)

This package contains the React + Vite frontend foundation for **AttendAI**, an AI-powered attendance management web application.

---

## Architecture Overview

```
frontend/
├── public/                 # Static assets (favicons, icons)
├── src/
│   ├── assets/             # Bundled static media
│   ├── components/
│   │   ├── common/         # Core reusable shared components
│   │   │   ├── Button.jsx & Button.css
│   │   │   ├── Container.jsx & Container.css
│   │   │   ├── EmptyState.jsx & EmptyState.css
│   │   │   ├── ErrorMessage.jsx & ErrorMessage.css
│   │   │   ├── LoadingIndicator.jsx & LoadingIndicator.css
│   │   │   ├── Navbar.jsx & Navbar.css
│   │   │   └── index.js
│   │   └── home/           # Homepage feature sections
│   │       ├── FeaturesSection.jsx & FeaturesSection.css
│   │       └── HowItWorksSection.jsx & HowItWorksSection.css
│   ├── hooks/              # Custom reusable hooks (e.g., useReducedMotion)
│   ├── layouts/            # Foundational layout wrappers
│   │   ├── PageShell.jsx & PageShell.css
│   ├── pages/              # Page views (code-split)
│   │   ├── HomePage.jsx & HomePage.css
│   │   └── NotFoundPage.jsx & NotFoundPage.css
│   ├── routes/             # Declarative React Router setup
│   │   ├── routes.js       # Route path registry
│   │   └── AppRoutes.jsx   # Suspense & lazy route config
│   ├── services/           # Service & client integration stubs
│   │   ├── apiClient.js    # FastAPI fetch client wrapper
│   │   └── supabaseClient.js # Supabase public configuration stub
│   ├── styles/             # Centralized design system styles
│   │   ├── global.css      # Typography, focus rings, utility classes
│   │   ├── reset.css       # Minimal modern CSS reset
│   │   └── variables.css   # Centralized CSS variables & design tokens
│   ├── utils/              # Configuration reader and utilities
│   │   └── config.js       # Safe browser environment configuration
│   ├── App.jsx             # Top-level Router & Shell provider
│   └── main.jsx            # Application entry point
├── test/
│   └── foundation.test.js  # Milestone 1 verification suite
├── .env.example            # Safe public environment variable template
├── .gitignore              # Dependency, build, and secret exclusions
├── package.json
└── vite.config.js
```

---

## Technology Stack

- **React 19** (JavaScript only, no TypeScript)
- **Vite 8**
- **Plain CSS** (Tokens in `variables.css`, no Tailwind CSS)
- **React Router 7**
- **Lucide React** (Icons)

---

## Available Scripts

From within the `frontend/` directory:

- `npm run dev` — Starts the local Vite development server.
- `npm run build` — Builds the optimized production assets into `dist/`.
- `npm run preview` — Serves the production build locally for verification.
- `npm run lint` — Runs `oxlint` against all source files.
- `npm test` — Executes the foundation compliance and verification suite.

---

## Security Guidelines

1. Variables prefixed with `VITE_` are client-visible and embedded into the client bundle at build time.
2. **Never** put Supabase service-role keys, database passwords, or private backend secrets in frontend code or `.env`.
3. Client authorization is handled through Supabase Row-Level Security (RLS) policies and FastAPI server-side verification.
