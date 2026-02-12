# Holiday River Expeditions — Website

Marketing website for Holiday River Expeditions, a guided whitewater rafting and nature experience company operating in Colorado and Utah for 60+ years.

## Prerequisites

- [Node.js](https://nodejs.org/) 20
- [pnpm](https://pnpm.io/) 10.29.3 (specified via `packageManager` in `package.json`)

## Getting Started

```sh
git clone <repo-url>
cd website
pnpm install
pnpm dev
```

The dev server starts at [http://localhost:3000](http://localhost:3000).

## Scripts

| Command             | Description                         |
| ------------------- | ----------------------------------- |
| `pnpm dev`          | Start the Next.js dev server        |
| `pnpm build`        | Production build                    |
| `pnpm start`        | Serve the production build          |
| `pnpm lint`         | Run ESLint                          |
| `pnpm format`       | Format files with Prettier          |
| `pnpm format:check` | Check formatting without writing    |
| `pnpm test`         | Run unit/integration tests (Vitest) |
| `pnpm test:e2e`     | Run Playwright E2E tests            |
| `pnpm typecheck`    | Run `tsc --noEmit`                  |

## Project Structure

```
src/
  app/            — Next.js App Router pages and API routes
  components/     — React components, organized by feature
  lib/            — Shared utilities (Arctic Reservations API client, etc.)
  sanity/         — Sanity CMS schemas and configuration
e2e/              — Playwright end-to-end tests
```

## Tech Stack

- **Next.js 16** (App Router) with **TypeScript** (strict mode)
- **Tailwind CSS** for styling
- **Sanity CMS** for content management
- **Arctic Reservations REST API** for booking
- **Vitest** + **Playwright** for testing
- **Vercel** for hosting

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs on pushes and pull requests to `main`, `develop`, and `beta`:

- Lint
- Format check
- Typecheck
- Unit tests
- Build
- E2E tests (Playwright, Chromium)

## Further Reading

See [CLAUDE.md](./CLAUDE.md) for conventions, architecture decisions, and deeper project detail.
