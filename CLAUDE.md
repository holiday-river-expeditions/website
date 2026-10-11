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

## Site copy

Holiday doesn't want AI-written copy on their site, and Darius doesn't want copy that reads as AI. This applies to every word a visitor or a Holiday editor sees: Sanity content, seed and import scripts, hardcoded strings in components, alt text, metadata and placeholders.

- Never write, paraphrase or tidy marketing or trip copy. Copy existing old-site text word for word, or leave a placeholder for Holiday to write.
- Placeholders read `[Holiday to write: <what goes here>]`, so editors can find them by searching the Studio for "Holiday to write".
- In UI strings you do write (labels, buttons, errors), use no em or en dashes and no semicolons, and avoid AI phrasing. Write short, plain sentences.

## Commands

- `pnpm dev` — start dev server
- `pnpm build` — production build
- `pnpm test` — run unit/integration tests
- `pnpm test:e2e` — run Playwright E2E tests
- `pnpm lint` — ESLint
- `pnpm typecheck` — tsc --noEmit

## Branching & Environments

### Branches

- `main` — Production branch. Auto-deploys to Vercel.
- `feature/*` — Short-lived feature branches, merged to `main` via PR.

### Vercel (Hobby plan, temporary)

- Production: auto-deploys from `main` → https://website-phi-six-25.vercel.app
- Preview: ephemeral deploys for PRs

## Documentation

- Project docs live in the sibling `docs/` repo (Obsidian vault)
- See docs/project/ for architecture decisions and build plan

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
