# Architektur

## Überblick

```
┌─────────────────┐        HTTPS        ┌──────────────────┐
│  Angular (SPA)   │ ───────────────────▶│  NestJS API        │
│  Netlify-Hosting │                     │  (Docker, Render)  │
└─────────────────┘                     └────────┬──────────┘
                                                   │
                              ┌────────────────────┼────────────────────┐
                              ▼                    ▼                    ▼
                     ┌─────────────┐      ┌───────────────┐   ┌────────────────┐
                     │ PostgreSQL  │      │  Object Storage│   │  Claude API /   │
                     │ + pgvector  │      │  (Quelldateien)│   │  Embeddings API │
                     └─────────────┘      └───────────────┘   └────────────────┘
```

## Frontend (Angular)
- Standalone Components, kein NgModule-Boilerplate
- 3-Spalten-Layout als Kern-Shell-Komponente (`app-notebook-shell`):
  Sources-Panel | Workspace | Studio-Panel
- State: einfacher Service-basierter State (Signals), kein NgRx nötig für
  diesen Umfang – bewusste Entscheidung gegen Over-Engineering
- Eigenes, schlankes Design-System (SCSS-Variablen für Farben/Typografie),
  kein Angular Material Default-Theme

## Backend (NestJS)
Module:
- `NotebooksModule` – CRUD für Notebooks
- `SourcesModule` – Upload, Textextraktion, Speicherung, später Chunking/Embedding
- `ChatModule` (Phase 3) – Retrieval + LLM-Anbindung
- `StudioModule` (Phase 4) – Summary/Audio-Overview-Generierung

Jedes Modul: Controller (REST-Endpunkte) → Service (Logik) → Repository
(TypeORM, Postgres). Klare Trennung, testbar.

## Datenmodell (vereinfacht, wächst mit den Phasen)
```
Notebook
  id, title, created_at

Source
  id, notebook_id (FK), filename, raw_text, storage_path, created_at

Chunk (ab Phase 3)
  id, source_id (FK), content, embedding (vector), position
```

## Deployment
- Frontend: Angular-Production-Build → Netlify (Auto-Deploy bei Push auf `main`)
- Backend: Docker-Image → Render (Auto-Deploy bei Push, TLS/Proxy/Restarts managed)
- DB: managed Postgres mit `pgvector`-Extension aktiviert

**Bewusst gegen Self-Hosting (Hetzner-VPS) entschieden:** ein eigener Server
mit nginx davor wäre für ein dauerhaft betreutes Projekt die richtige Wahl,
bringt hier aber nur zusätzliches Ops-Risiko ohne Gegenwert – Render liefert
denselben Docker-Container zuverlässiger und mit weniger Aufwand aus.

## Bewusste Vereinfachungen (für Loom-Video relevant)
- Kein volles Auth-System in der ersten Version – Fokus liegt auf RAG-Qualität
  und UI, nicht auf User-Management
- Kein Nx-Monorepo – ein Repo mit zwei Ordnern reicht für diesen Umfang und
  ist für Reviewer einfacher zu lesen
- State-Management bewusst simpel gehalten (Signals statt NgRx) – Umfang der
  App rechtfertigt den zusätzlichen Overhead nicht
- Kein eigener VPS/nginx-Reverse-Proxy, obwohl im Alltag genutzt – für diese
  zeitkritische Aufgabe war verlässliches Managed-Hosting (Render) die
  bewusstere Wahl als Ops-Aufwand für Server-Setup
