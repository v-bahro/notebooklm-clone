# Quellwerk – ein NotebookLM-Klon

Testaufgabe für die Softwareentwickler-Rolle bei everlast. Ein schlanker,
selbst gebauter Klon von NotebookLM: Notebooks anlegen, Quellen hochladen und
(in späteren Phasen) mit ihnen chatten – mit Zitaten, die auf die
Quellstelle zurückverweisen.

## Struktur
```
/frontend   Angular 19 (standalone components)
/backend    NestJS + PostgreSQL (TypeORM)
/docs       PLAN.md, ARCHITECTURE.md, DECISIONS.md, DESIGN.md
```

## Stand
Phase 1–3 abgeschlossen: Notebook-Übersicht (anlegen/umbenennen/löschen),
3-Spalten-Notebook-Ansicht (Quellen | Arbeitsbereich | Studio) mit eigenem
Design-System, Quellen hochladen (PDF/.txt) oder als Text einfügen, RAG-Chat
mit klickbaren Zitaten (Antworten ausschließlich aus den eigenen Quellen,
mit exakt markiertem Ausschnitt in der Quelle). Backend läuft gegen echtes
Postgres inkl. `pgvector`, End-to-end manuell sowie gegen die echten OpenAI-/
Claude-APIs verifiziert. Details und weitere Phasen: siehe `docs/PLAN.md`.

## Lokal starten

### Voraussetzungen
- Node.js 22+
- PostgreSQL 16 mit [pgvector](https://github.com/pgvector/pgvector)-Extension
  (lokal oder via Docker – das offizielle `pgvector/pgvector` Docker-Image
  bringt die Extension bereits mit; bei lokalem Postgres ggf. `pgvector`
  separat installieren)
- Ein OpenAI-API-Key (Embeddings) und ein Anthropic-API-Key (Chat) für die
  Chat-Funktion – optional, ohne sie laufen Notebooks/Quellen normal weiter,
  der Chat antwortet dann nur mit einer Fehlermeldung

### Backend
```bash
cd backend
cp .env.example .env   # DB-Zugangsdaten anpassen, OPENAI_API_KEY/ANTHROPIC_API_KEY eintragen
npm install
npm run start:dev
```
Läuft auf `http://localhost:3000`. Erwartet eine Postgres-Datenbank gemäß
`.env` (Tabellen werden beim Start automatisch angelegt, `synchronize: true`
– ausschließlich für lokale Entwicklung, siehe `docs/DECISIONS.md`). Die
`vector`-Extension und die `embedding`-Spalte auf `chunks` werden beim
Start automatisch angelegt (`CREATE EXTENSION IF NOT EXISTS vector`).

### Frontend
```bash
cd frontend
npm install
npm start
```
Läuft auf `http://localhost:4200` und erwartet das Backend auf
`http://localhost:3000` (siehe `src/environments/environment.ts`).

## Deployment (geplant, Phase 5)
- Frontend: Netlify
- Backend: Render (Docker)

Details und Begründung: `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`.
