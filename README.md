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
Phase 1 abgeschlossen: Notebook-Übersicht (anlegen/umbenennen/löschen),
3-Spalten-Notebook-Ansicht (Quellen | Arbeitsbereich | Studio) mit eigenem
Design-System. Backend-CRUD läuft gegen echtes Postgres, End-to-end manuell
verifiziert. Details und weitere Phasen: siehe `docs/PLAN.md`.

## Lokal starten

### Voraussetzungen
- Node.js 22+
- PostgreSQL 16 (lokal oder via Docker)

### Backend
```bash
cd backend
cp .env.example .env   # ggf. DB-Zugangsdaten anpassen
npm install
npm run start:dev
```
Läuft auf `http://localhost:3000`. Erwartet eine Postgres-Datenbank gemäß
`.env` (Tabellen werden beim Start automatisch angelegt, `synchronize: true`
– ausschließlich für lokale Entwicklung, siehe `docs/DECISIONS.md`).

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
