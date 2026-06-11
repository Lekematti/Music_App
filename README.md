# Music App

A full-stack music streaming web application where users can register, upload their own tracks, browse and search music, rate songs, and manage their profile — including a global persistent audio player.

**Live demo:** [music-app-d7xr.onrender.com](https://music-app-d7xr.onrender.com)

> ⚠️ The backend is hosted on Render's free tier. If the app has been inactive, the server may take up to ~50 seconds to wake up on the first request.

---

## Features

- User registration and login with JWT authentication
- Forgot password / reset password flow via email
- Upload songs (MP3) with optional cover images
- Global persistent audio player with play/pause, seek, and skip controls
- Browse new uploads, top-rated songs, and your own past uploads
- Search songs by title or artist with live suggestions
- Star rating system for songs
- User profile management (avatar, username, email, password)
- Account deletion with full cleanup of related data and storage
- Responsive multi-page frontend with client-side navigation

---

## Tech Stack

### Frontend
- **Vanilla JavaScript** (ES Modules, Web Components / Custom Elements)
- **HTML5** & **CSS3**
- **Vite** — build tool and dev server

### Backend
- **Node.js** with **Express**
- **PostgreSQL** via **Prisma ORM** (hosted on Supabase)
- **Supabase Storage** — buckets for songs, covers, and avatars
- **JWT** — authentication and authorization
- **Resend** — transactional email for password resets

### Testing & Quality
- **Vitest** — unit and integration testing (frontend & backend)
- **ESLint** — linting
- **Prettier** — code formatting

### DevOps
- **GitHub Actions** — CI (tests, coverage & build) and CD (deployment)
- **Render** — hosting for both frontend (Static Site) and backend (Web Service)
- **Renovate** — automated dependency updates with a minimum package age policy for supply-chain safety

---

## Deployment

The app is deployed on **Render**:

- **Frontend** — Static Site, built with `npm ci && npm run build`, published from `frontend/dist`
- **Backend** — Web Service, built with `npm ci && npx prisma generate --schema=backend/prisma/schema.prisma`, started with `node backend/index.js`

### CI/CD

- **CI** (`.github/workflows/ci.yml`) runs on every push and pull request: installs dependencies, generates the Prisma client, runs unit/integration/frontend tests with coverage, and builds the frontend.
- **CD** (`.github/workflows/cd.yml`) is triggered manually via `workflow_dispatch` and deploys the frontend and backend to Render via deploy hooks.

---

## Database (Prisma)

- **User** — account info, hashed password, optional avatar; owns songs, ratings, and password reset requests
- **Song** — uploaded track metadata and storage references; belongs to a user, has many ratings
- **Rating** — 1–5 star score per user per song (unique constraint prevents duplicate ratings)
- **PasswordReset** — single-use, expiring tokens for the forgot-password flow; cascades on user deletion

---

## Author

Built by **Leo Koskimäki** as a personal portfolio and learning project.
