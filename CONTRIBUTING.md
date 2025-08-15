## Contributing & Maintenance Guidelines

This repository hosts a Next.js (App Router) application focused on an interactive architecture diagram editor built on React Flow.

### Goals
1. Keep the core diagram interactions fast and responsive (low re-renders, memoized nodes).
2. Maintain clear separation between UI components, domain logic (diagram model), and utilities.
3. Make code easy to extend programmatically (e.g. by an AI agent) with minimal implicit coupling.

### Project Layout
```
src/
  app/                # App Router route tree (Server Components by default)
  components/         # Reusable UI + diagram building blocks
    diagram/          # (Planned) extracted subcomponents from DiagramCanvas
  hooks/              # React hooks
  lib/                # Pure utilities & catalog data
  types/              # Shared TypeScript types
  utils/              # Generic helpers (migration candidate into lib/ later)
```

### Component Guidelines
* Server Components for pages/layouts; Client Components only when interactivity/state is needed (mark with `"use client"`).
* Keep large stateful composites (like the diagram canvas) progressively decomposed into smaller files in `components/diagram/`.
* Co-locate very small helper components with their parent until they exceed ~150 lines or gain wider reuse.

### TypeScript Guidelines
* Prefer `readonly` arrays/tuples for static catalogs (immutability aids reasoning).
* Use discriminated unions for node/edge custom data shapes when extending features.
* Avoid `any`; when unavoidable, wrap with TODO typed fences: `// TODO: type-narrow`.

### Styling & UI
* TailwindCSS for utility classes. Keep semantic groupings with inline comments for complex class clusters.
* Prefer composable primitives (`IconButton`, toolbar sections) over ad-hoc clusters.

### State Management
* Local React state inside diagram components. If future cross-page persistence is needed, introduce a lightweight context (`contexts/DiagramContext.tsx`). Avoid premature global stores.
* Undo/redo kept local & serialized to `localStorage`. For backend sync, wrap persistence in an abstraction `lib/persistence.ts`.

### File Header Markers
Large composite files should include region markers like:
```ts
// == Toolbar Region ====================================================
// code ...
// == End Toolbar Region ===============================================
```
These help automated tools target sections safely.

### Testing (Planned)
Introduce Vitest + React Testing Library:
* utils (pure) — unit tests
* catalog integrity (unique IDs, valid icon urls)
* serialization / export-import round trip

### Lint & Formatting
* ESLint (Next.js config) enforces quality. Docker build currently skips lint for speed (`next.config.ts`). CI SHOULD run `npm run lint && npm run typecheck`.
* Add Prettier only if style drift emerges (not added yet to reduce tool surface).

### Commit Conventions
Use semantic-ish prefixes: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `test:`. Keep subject <= 72 chars.

### Adding Palette Entries
1. Update `src/lib/catalog.ts`.
2. Ensure `id` unique.
3. Prefer CDN SVG from Simple Icons or small inline data URI (≤2KB).
4. Color should be accessible (contrast for text overlay if reused as background).

### Accessibility
* Icon buttons require `aria-label` (handled by `IconButton`).
* Maintain focus styles (Tailwind focus ring). Do not remove outlines.

### Performance Notes
* Avoid recreating functions inside large React Flow node renderers; memoize where feasible.
* When adding expensive derived data, compute outside render or with `useMemo` keyed properly.

### Roadmap (High-Level)
| Area | Intent |
|------|--------|
| Testing | Add vitest + initial suite |
| i18n | Introduce simple dictionary loader |
| Persistence | Optional server/API route backend |
| Theming | Dark mode toggle + CSS variables audit |
| Node Types | Extensible registry pattern |

### PR Checklist
* [ ] Types strictly defined (no new implicit `any`)
* [ ] No large anonymous functions inside frequently-rendered nodes unless memoized
* [ ] Added/updated docs for new public components
* [ ] Lint + typecheck passes locally
* [ ] No secrets or large binary assets committed

---
Maintainers: optimize for clarity first, micro-optimizations second. Simplicity > cleverness.
