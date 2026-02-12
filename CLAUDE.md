# Holiday River Expeditions — Website

## Project

- Client: Holiday River Expeditions (currently bikeraft.com)
- Guided white water rafting and nature experience company, Colorado & Utah
- 60+ years in operation
- Brand pivot: rafting-first, bikes secondary
- New domain: holidayriverexpeditions.com (TBD)

## Tech Stack

- Next.js 16 (App Router) with TypeScript (strict mode)
- Sanity CMS for content management
- Tailwind CSS for styling
- Vercel for hosting
- Arctic Reservations REST API for booking
- Vitest + Playwright for testing
- GitHub Actions for CI
- pnpm for package management

## Conventions

- TypeScript strict mode, no `any`
- All components in src/components/, organized by feature
- Sanity schemas in src/sanity/schemas/
- Arctic API client in src/lib/arctic/
- API routes in src/app/api/
- Tests colocated next to source files (\*.test.ts)
- E2E tests in e2e/
- Use Zod for runtime validation at API boundaries
- Tailwind for all styling — no CSS modules or styled-components

## Commands

- `pnpm dev` — start dev server
- `pnpm build` — production build
- `pnpm test` — run unit/integration tests
- `pnpm test:e2e` — run Playwright E2E tests
- `pnpm lint` — ESLint
- `pnpm typecheck` — tsc --noEmit

## Branching & Environments

### Branches

- `main` — Production-ready code. Deploys to production (holidayriverexpeditions.com)
- `beta` — Staging/QA. Deploys to beta environment (beta.holidayriverexpeditions.com)
- `develop` — Active development integration branch

### Flow

feature/\* → develop → beta → main

- Feature branches branch off `develop`
- PRs merge feature branches into `develop`
- When ready for QA/stakeholder review, PR from `develop` → `beta`
- When approved for release, PR from `beta` → `main`

### Vercel Environments

- Production: auto-deploys from `main` branch
- Beta: auto-deploys from `beta` branch (custom domain: beta.holidayriverexpeditions.com)
- Preview: ephemeral deploys for all other branches/PRs

## Documentation

- Project docs live in the sibling `docs/` repo (Obsidian vault)
- See docs/project/ for architecture decisions and build plan
