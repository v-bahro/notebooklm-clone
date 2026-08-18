# NotebookLM-Klon – Projektplan

## Ziel
Testaufgabe für die Softwareentwickler-Rolle bei everlast. Ziel ist kein
Feature-vollständiger Klon, sondern ein sauber gebautes, gut dokumentiertes
MVP, das zeigt: strukturiertes Vorgehen, solide Architektur, bewusste
Priorisierung, gutes UI/UX-Gespür.

Deliverables laut Aufgabenstellung:
- GitHub-Repo (mit nachvollziehbarer Commit-History)
- Live-Deployment
- Loom-Video (max. 10 Min): Vorgehen erklären + Klon live testen

## Tech-Stack

| Bereich | Wahl | Begründung |
|---|---|---|
| Frontend | Angular (standalone components) + TypeScript + SCSS | Vincents Alltagsstack, hohe Sicherheit/Geschwindigkeit |
| Backend | NestJS + TypeORM (oder Prisma) | Vincents Alltagsstack, saubere modulare Architektur |
| Datenbank | PostgreSQL + `pgvector`-Extension | Relationale Daten + Vektorsuche in einem System |
| Storage | S3-kompatibler Bucket (Supabase Storage oder MinIO) | Einfache Anbindung an NestJS, kein eigenes Dateisystem-Handling |
| Frontend-Hosting | Netlify | Vincents übliches Setup, Angular-Build direkt deploybar |
| Backend-Hosting | Render (Docker-Deploy) | verlässlich, TLS/Proxy/Restarts managed, minimaler Ops-Aufwand während der zeitkritischen Testaufgabe |
| LLM (später) | Claude API | für RAG-Chat, Summary-Generierung |
| Embeddings (später) | OpenAI `text-embedding-3-small` | günstig, ausreichend gut |
| TTS (später, Stretch) | OpenAI TTS / ElevenLabs | Audio Overview |

Repo-Struktur: **ein Repo**, zwei Ordner (`/frontend`, `/backend`) – einfacher
für HR nachzuvollziehen als Nx-Monorepo oder zwei separate Repos.

## Design-Richtung
- Ruhige, papierartige Ästhetik: reduzierte Farbpalette (2–3 Töne, kein
  Gradient, kein Standard-Indigo/Violett-KI-Look), Serif für Überschriften,
  klare Sans für UI-Text, viel Weißraum.
- **Layout orientiert sich am NotebookLM-Original**: 3-Spalten-Aufbau
  - links: Quellen-Panel (Liste hochgeladener Dokumente)
  - Mitte: Chat/Arbeitsbereich
  - rechts: Studio-Panel (später: Summary, Audio Overview etc., erstmal Platzhalter)
- Kein Angular-Material-Standardlook – eigenes, schlankes Komponenten-Set.

## Phasen (Basic-First, wie besprochen)

### Phase 0 – Setup
- Repo-Grundgerüst (`/frontend` Angular, `/backend` NestJS)
- Doku-Skelett: `PLAN.md`, `ARCHITECTURE.md`, `DECISIONS.md`, README
- CI-light: Lint/Build-Check (optional GitHub Action)
- Commit: `chore: initial project scaffold`

### Phase 1 – Basic Website (NotebookLM-Layout, ohne Funktion)
- Angular-Routing, 3-Spalten-Layout, Design-Tokens (Farben, Typografie)
- Notebook anlegen/umbenennen/löschen (CRUD, NestJS + Postgres)
- Leerer Zustand für Quellen- und Studio-Panel
- **Meilenstein:** man kann durch die App klicken, Notebooks anlegen –
  noch kein Upload, kein Chat

### Phase 2 – File Upload (erstes echtes Feature)
- NestJS-Endpoint für Upload (PDF, .txt, eingefügter Text)
- Storage-Anbindung (Bucket)
- Textextraktion aus PDF (z. B. `pdf-parse`)
- Quellen-Liste im Frontend, Quelle anklickbar → Rohtext-Ansicht
- **Meilenstein:** Datei hochladen, sehen dass sie verarbeitet wurde

### Phase 3 – RAG-Chat
- Chunking + Embeddings beim Upload
- Vektorsuche (`pgvector`) + Claude-API-Integration
- Chat-UI, Antworten ausschließlich aus Quellen, klickbare Zitate

### Phase 4 – Stretch (später, wie besprochen)
- Studio-Feature: One-Click Summary/Study Guide
- Audio Overview (Skript-Generierung + Zwei-Stimmen-TTS)
- Mehrsprachigkeit, falls Zeit bleibt

### Phase 5 – Deploy & Abgabe
- Frontend auf Netlify, Backend als Docker-Image auf Render
- End-to-End-Test
- README finalisieren (Screenshots, Setup-Anleitung, Live-Link)
- Loom-Video aufnehmen

## Entscheidungen
- Backend-Hosting: **Render** statt eigener Hetzner-VPS. Begründung: verlässlich
  mit minimalem Ops-Aufwand während einer zeitkritischen Testaufgabe. Der VPS
  wäre für ein dauerhaft betreutes Projekt sinnvoll, hier überwiegt das
  Ops-Risiko den Kontrollgewinn.

## Offene Fragen
- [ ] Zeitbudget bis Deadline?
