# Work Quest Stats Dashboard

A lightweight React + Vite single-page app that pulls Harry's work stats, XP hooks, and level curve directly from the shared Google Sheet and renders them as a glassy, distraction-free dashboard. Designed for GitHub Pages hosting.

![screenshot](public/favicon.svg)

## Tech stack

- **React + TypeScript + Vite** for a fast static build
- **Google Sheets GViz API** for zero-backend data access
- **gh-pages** CLI to publish to the `gh-pages` branch

## Local development

```bash
npm install --include=dev  # ensures TypeScript + Vite deps are installed
npm run dev                # start Vite dev server
```

Environment values (sheet IDs, tab names) live inside `src/App.tsx`. Update them if the spreadsheet structure changes.

## Build + deploy

```bash
npm run build   # type-check + production bundle (outputs to dist/)
npm run deploy  # builds + pushes dist/ to the gh-pages branch
```

GitHub Pages is configured to serve from `gh-pages` → `/`. Once a deploy finishes, the site is available at <https://sora-claw.github.io/stats/>.

## Data tabs consumed

| Sheet tab  | Purpose                     |
|------------|-----------------------------|
| `Harry`    | Core stats + XP hooks text  |
| `XP_Hooks` | Action → XP matrix          |
| `XP_Levels`| Level 1–99 XP curve         |

Any additional tabs can be wired up by repeating the `fetchSheet()` pattern in `src/App.tsx`.
