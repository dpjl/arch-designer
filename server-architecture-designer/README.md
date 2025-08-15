## Server Architecture Designer

Visual designer (React Flow + Next.js App Router) pour modeler rapidement des architectures: composants, réseaux, portes (doors), relations.

### Caractéristiques
- Mode Edition / Mode Visualisation (lecture seule)
- Drag & drop palette (containers, services, réseaux, génériques, sécurité)
- Groupes / containers imbriqués + réseaux associables
- Undo / Redo (historique localStorage)
- Export PNG et JSON, import JSON
- Alignement / snap grille 24px
- Responsive (panneaux latéraux, barre compacte, overlay mobile)

### Démarrage
```bash
npm install
npm run dev
# http://localhost:3000
```

### Scripts
| Script | Description |
| ------ | ----------- |
| dev | Démarrage développement (Turbopack) |
| build | Build production Next.js (standalone) |
| start | Lancer build compilé |
| lint | Lint du code |

### Structure
```
src/
	app/            # App Router
	components/     # UI & diagramme
	lib/            # Catalogues & utilitaires
	hooks/
	types/
```

`DiagramCanvas.tsx` est un composant client lourd (interactions React Flow). `page.tsx` importe directement le composant (pas de dynamic ssr:false) conformément aux bonnes pratiques.

### Mode View vs Edit
| Action | Edit | View |
| ------ | ---- | ---- |
| Déplacer / redimensionner | ✅ | ❌ |
| Créer / supprimer noeuds | ✅ | ❌ |
| Connecter / supprimer liens | ✅ | ❌ |
| Undo / Redo | ✅ | ❌ (désactivé) |
| Export / Import / Save | ✅ | ✅ |

### Export / Import
PNG: capture du canvas (html-to-image)
JSON: { nodes:[], edges:[] } (structure React Flow standard augmentée de data custom)

### Docker
```bash
docker build -t server-architecture-designer .
docker run --rm -p 3000:3000 server-architecture-designer
```
Ou via compose (cache busting possible via FORCE_REBUILD):
```bash
FORCE_REBUILD=$(date +%s) docker compose up --build
```

### Qualité & Lint
ESLint Next + TS strict activé. Le build Docker ignore ESLint (`next.config.ts`) pour accélérer; exécuter localement avant CI/CD.

### Améliorations futures
- Tests unitaires (catalog, utils de positionnement, snapping)
- Accessibilité approfondie (keyboard nav sur nodes)
- Internationalisation (en cours FR→EN toggle)
- Persist server-side (remplacer localStorage par API route)

### Licence
Interne (définir une licence si open source plus tard).

## Docker

Build and run a production container locally:

```bash
docker build -t server-architecture-designer .
docker run --rm -p 3000:3000 server-architecture-designer
```

Using docker compose:

```bash
docker compose up --build
```

The Dockerfile uses a multi-stage build (deps -> builder -> minimal runtime) and Next.js standalone output. Runs as a non-root user on port 3000.

Note: ESLint is ignored during Docker production build (see `next.config.ts` `eslint.ignoreDuringBuilds=true`). Address lint errors locally before enabling it again.
