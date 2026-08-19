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
| Storage | Extrahierter Text direkt in Postgres (kein Bucket) | Siehe `docs/DECISIONS.md` – Original-Datei wird nicht dauerhaft gebraucht, nur ihr Text |
| Frontend-Hosting | Netlify | Vincents übliches Setup, Angular-Build direkt deploybar |
| Backend-Hosting | Render (natives Node-Web-Service, kein Docker) | verlässlich, TLS/Proxy/Restarts managed, minimaler Ops-Aufwand – siehe `docs/DECISIONS.md` für die Docker-Abweichung |
| LLM | Claude API (`claude-opus-5`) | für RAG-Chat, später Summary-Generierung |
| Embeddings | OpenAI `text-embedding-3-small` | günstig, ausreichend gut |
| Vektorindex | `pgvector` (Cosine-Distanz, Brute-Force ohne ANN-Index) | Datenmenge in dieser Aufgabe klein genug, dass ein Index keinen Mehrwert bringt |
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

### Phase 0 – Setup ✅
- [x] Repo-Grundgerüst (`/frontend` Angular, `/backend` NestJS)
- [x] Doku-Skelett: `PLAN.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `DESIGN.md`, README
- [ ] CI-light: Lint/Build-Check (optional GitHub Action) – noch offen
- Commit: `chore: initial project scaffold`

### Phase 1 – Basic Website (NotebookLM-Layout, ohne Funktion) ✅
- [x] Angular-Routing, 3-Spalten-Layout, Design-Tokens (Farben, Typografie)
- [x] Notebook anlegen/umbenennen/löschen (CRUD, NestJS + Postgres)
- [x] Leerer Zustand für Quellen- und Studio-Panel
- **Umgesetzt:** Notebook-Übersicht (`/`) mit Anlegen/Umbenennen/Löschen
  (Inline-Editing statt Browser-`prompt()`/`confirm()`), 3-Spalten-Notebook-
  Ansicht (`/notebooks/:id`) mit editierbarem Titel. Design-System aus
  `docs/DESIGN.md` umgesetzt (Papier-Palette, Source Serif 4 / IBM Plex,
  dezente Lineatur im Arbeitsbereich als Signatur-Element). Backend-CRUD
  end-to-end gegen echtes Postgres verifiziert (Create/Read/Update/Delete,
  Validierungsfehler 400, 404 nach Delete). `ng build --configuration
  production` läuft fehlerfrei durch.

### Phase 2 – File Upload (erstes echtes Feature) ✅
- [x] NestJS-Endpoint für Upload (PDF, .txt, eingefügter Text)
- [x] Textextraktion aus PDF (`pdf-parse` v2) und .txt
- [x] Quellen-Liste im Frontend, Quelle anklickbar → Rohtext-Ansicht
- **Umgesetzt:** `SourcesModule` (Backend) mit `/notebooks/:id/sources`
  (Upload via `FileInterceptor`, Text-Endpoint für eingefügten Text, Liste,
  Löschen, Cascade-Delete über die Notebook-FK). Extrahierter Text landet
  direkt als Postgres-`text`-Spalte auf dem `sources`-Eintrag – **kein
  separater Bucket** (siehe `docs/DECISIONS.md`, Abweichung vom ursprünglichen
  Plan). Frontend: Quellen-Panel mit Datei-Upload, "Text einfügen"-Formular,
  Quellen-Liste mit Lösch-Bestätigung (gleiches Inline-Muster wie bei
  Notebooks), Klick auf Quelle zeigt Rohtext im Arbeitsbereich. End-to-end
  gegen echtes Postgres verifiziert (Upload .txt/.pdf, Text einfügen, Liste,
  Ansehen, Löschen, Cascade-Delete beim Notebook-Löschen, Fehlerfälle:
  falscher Dateityp, nicht vorhandenes Notebook) sowie im Browser (Angular
  Dev-Server) durchgeklickt. Beide Production-Builds laufen fehlerfrei durch.
- **Meilenstein erreicht:** Datei hochladen, sehen dass sie verarbeitet wurde.

### Phase 3 – RAG-Chat ✅
- [x] Chunking + Embeddings beim Upload
- [x] Vektorsuche (`pgvector`) + Claude-API-Integration
- [x] Chat-UI, Antworten ausschließlich aus Quellen, klickbare Zitate
- **Umgesetzt:** Beim Speichern einer Quelle (Upload oder Text) chunkt
  `IndexingService` den Inhalt (gleitendes Fenster, ~1000 Zeichen, 150 Zeichen
  Überlappung, Wortgrenzen-bewusst) und embedded jeden Chunk über OpenAI
  `text-embedding-3-small`; Embeddings landen als `vector(1536)`-Spalte auf
  `chunks` (pgvector-Extension wird beim App-Start automatisch aktiviert,
  siehe `VectorSchemaService`). `ChatService` embedded die Nutzerfrage,
  holt per Cosine-Distanz die passendsten Chunks aus dem aktuellen Notebook,
  baut daraus einen nummerierten Prompt und lässt `claude-opus-5` ausschließlich
  auf dieser Basis antworten – mit `[n]`-Zitaten im Fließtext. Antworten und
  Zitate (inkl. Zeichen-Offset im Quelltext) werden in einer `messages`-Tabelle
  persistiert, sodass der Chatverlauf einen Reload übersteht. Frontend:
  `ChatPanelComponent` ersetzt den Chat-Platzhalter im Arbeitsbereich,
  `[n]`-Zitate sind klickbar und öffnen die zitierte Quelle mit exakt
  markiertem Ausschnitt (`<mark>` über den gespeicherten Zeichen-Offset).
  Fehlerfälle sind bewusst weich abgefangen: fehlt ein API-Key, bricht weder
  der Quellen-Upload noch die App beim Start – der Chat antwortet stattdessen
  mit einer verständlichen Fehlermeldung (beide SDK-Clients werden lazy
  instanziiert, siehe `docs/DECISIONS.md`). End-to-end gegen echte OpenAI-/
  Claude-APIs verifiziert: mehrteilige Quelle korrekt gechunkt, Retrieval über
  mehrere Chunks/Quellen hinweg, Zitat-Highlight exakt auf den richtigen
  Abschnitt begrenzt, Anfragen außerhalb der Quellen werden korrekt
  zurückgewiesen statt halluziniert.

### Phase 4 – Stretch (später, wie besprochen)
- Studio-Feature: One-Click Summary/Study Guide
- Audio Overview (Skript-Generierung + Zwei-Stimmen-TTS)
- Mehrsprachigkeit, falls Zeit bleibt

### Phase 5 – Deploy & Abgabe 🚧
- [x] Deployment-Konfiguration vorbereitet (render.yaml, netlify.toml)
- [ ] Render-Account/Netlify-Account einrichten (Vincent) und Blueprint/Site
      tatsächlich deployen
- [ ] End-to-End-Test gegen die Live-URLs
- [ ] README finalisieren (Live-Link)
- [ ] Loom-Video aufnehmen
- **Umgesetzt (Vorbereitung):** `render.yaml` (Blueprint) definiert Postgres-DB
  (`plan: free`, pgvector-fähig ab Postgres 13, kein manueller Schritt nötig –
  die App legt die Extension beim Start selbst an) + Backend als natives
  Node-Web-Service (kein Docker mehr, siehe `docs/DECISIONS.md`), DB-Connection
  per `DATABASE_URL` aus `fromDatabase`. `netlify.toml` baut das Frontend
  (`ng build --configuration production`) und liefert `dist/frontend/browser`
  mit SPA-Redirect-Regel aus. `environment.production.ts` zeigt vorab auf die
  aus dem Service-Namen vorhergesagte Render-URL
  (`https://quellwerk-backend.onrender.com`) – falls Render einen anderen
  Namen vergibt, muss das nach dem ersten Deploy angepasst werden.
  `VectorSchemaService` fängt jetzt Fehler beim pgvector-Setup ab, damit ein
  Problem dort nie den kompletten App-Start blockiert. Account-Anlage bei
  Netlify/Render sowie das eigentliche Deployment sind manuelle Schritte, die
  nur Vincent ausführen kann.

## Entscheidungen
- Backend-Hosting: **Render** statt eigener Hetzner-VPS. Begründung: verlässlich
  mit minimalem Ops-Aufwand während einer zeitkritischen Testaufgabe. Der VPS
  wäre für ein dauerhaft betreutes Projekt sinnvoll, hier überwiegt das
  Ops-Risiko den Kontrollgewinn.

## Offene Fragen
- [ ] Zeitbudget bis Deadline?
