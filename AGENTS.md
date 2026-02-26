# AGENTS.md

## Cursor Cloud specific instructions

### Repository structure

This is a monorepo with three web products:

| Product | Path | Dev Command | Port | Stack |
|---|---|---|---|---|
| PlayThings (main) | `/workspace` | `npm run dev` | 3000 | Vite + vanilla JS + Supabase |
| Athena Invest | `/workspace/athena-invest` | `npm run dev` | 3001 | Vite + vanilla JS |
| Sexersize | `/workspace/sexersize` | `npx serve .` | any | Static HTML/CSS/JS |

### Running the dev servers

- **PlayThings**: `npm run dev` from the repo root. Runs on port 3000. Works in demo mode (localStorage) without Supabase credentials.
- **Athena Invest**: `npm run dev` from `athena-invest/`. Runs on port 3001. Pure frontend, no external deps.
- **Sexersize**: Open `sexersize/index.html` directly or use `npx serve .` from that directory. No build step needed.

### Key notes

- The package manager is **npm** (lockfiles are `package-lock.json`). Run `npm install` in both `/workspace` and `/workspace/athena-invest`.
- There is no linter, test runner, or formatter configured in this repo. No `eslint`, `prettier`, `jest`, or `vitest`.
- Supabase credentials are optional. Without them (`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`), PlayThings falls back to localStorage demo mode for the CRM and subscriber features.
- Vite config sets `server.open: true` by default; pass `--open false` when running headlessly.
- Build both Vite projects with `npm run build` in their respective directories.
