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
Phase 1–3 und 5 abgeschlossen, Phase 4 teilweise: Notebook-Übersicht
(anlegen/umbenennen/löschen), 3-Spalten-Notebook-Ansicht (Quellen |
Arbeitsbereich | Studio) mit eigenem Design-System, Quellen hochladen
(PDF/.txt) oder als Text einfügen, RAG-Chat mit klickbaren Zitaten
(Antworten ausschließlich aus den eigenen Quellen, mit exakt markiertem
Ausschnitt in der Quelle), Ein-Klick-Zusammenfassung im Studio-Panel. Live
deployed (Netlify + Render, siehe unten). Backend läuft gegen echtes
Postgres inkl. `pgvector`, End-to-end manuell sowie gegen die echten OpenAI-/
Claude-APIs verifiziert. Audio Overview (Zwei-Stimmen-TTS) bewusst nicht
umgesetzt – siehe `docs/DECISIONS.md`. Details und weitere Phasen: siehe
`docs/PLAN.md`.

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

## Deployment

- **Backend → Render**, per Blueprint (`render.yaml` im Repo-Root): legt eine
  Postgres-Datenbank (inkl. `pgvector`) und den Backend-Service automatisch an.
  1. Auf [render.com](https://render.com) einloggen/registrieren, GitHub-Repo
     verbinden.
  2. **New → Blueprint**, dieses Repo auswählen – Render erkennt `render.yaml`
     und schlägt DB + Web-Service vor.
  3. Bei den abgefragten Secrets `OPENAI_API_KEY` und `ANTHROPIC_API_KEY`
     eintragen (aus der lokalen `backend/.env`).
  4. Nach dem ersten Deploy: die zugewiesene Backend-URL notieren (Standard
     wäre `https://quellwerk-backend.onrender.com`, kann abweichen, falls der
     Name schon vergeben ist).
- **Frontend → Netlify**, per `netlify.toml` im Repo-Root:
  1. Auf [netlify.com](https://netlify.com) einloggen/registrieren, **Add new
     site → Import an existing project**, dieses Repo auswählen – Netlify
     erkennt `netlify.toml` (Build-Command, Publish-Dir, SPA-Redirect)
     automatisch.
  2. Nach dem Deploy die zugewiesene Netlify-URL notieren.
- **Beide URLs verbinden** (nach dem ersten Deploy beider Seiten):
  - Falls die Render-Backend-URL von der Vorhersage abweicht:
    `frontend/src/environments/environment.production.ts` anpassen und neu
    deployen (Netlify baut bei jedem Push automatisch neu).
  - Im Render-Dashboard bei `quellwerk-backend` → Environment die Variable
    `FRONTEND_ORIGIN` auf die echte Netlify-URL setzen (für CORS).

Details und Begründung: `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`.
