# Entscheidungslog

Kurze, chronologische Liste bewusster Architektur-/Design-Entscheidungen und
ihrer Begründung. Ziel: Nachvollziehbarkeit für Reviewer, nicht Vollständigkeit.

## 2026-08 – Ein Repo, zwei Ordner statt Monorepo-Tooling
Angular (`/frontend`) und NestJS (`/backend`) liegen in einem Repo, aber ohne
Nx o. Ä. Für den Umfang dieser Aufgabe reicht das; Nx wäre Overhead, den
niemand hier bezahlt.

## 2026-08 – Kein Auth-System in Phase 1
Notebooks sind für die Testaufgabe implizit einem Demo-User zugeordnet.
Vollständiges Auth (Login, Sessions, Rollen) würde Zeit von RAG-Qualität und
UI abziehen, ohne die eigentliche Aufgabenstellung ("baue einen
NotebookLM-Klon") zu bedienen.

## 2026-08 – State-Management: Angular Signals statt NgRx
Der Datenfluss ist einfach genug (Notebook-Liste, aktives Notebook, Quellen),
dass ein Signal-basierter Service-State reicht. NgRx wäre für diesen Umfang
Boilerplate ohne Mehrwert.

## 2026-08 – Backend-Hosting: Render statt eigener Hetzner-VPS
Verlässlichkeit mit minimalem Ops-Aufwand hatte für diese zeitkritische
Aufgabe Priorität vor voller Server-Kontrolle. Details siehe
`ARCHITECTURE.md`.

## 2026-08 – Design: kein Standard-KI-Look
Bewusst gegen warme Creme-Fläche + Serif + Terracotta-Akzent entschieden
(zu häufiges KI-generiertes Muster) und gegen Standard-Angular-Material-Theme.
Stattdessen: gedämpftes Papier-Weiß, gedeckter Tintenblau-Akzent, dezente
Lineatur im Arbeitsbereich als Anspielung auf ein echtes Notizbuch. Details
siehe `docs/DESIGN.md`.

## 2026-08 – Quellen: extrahierter Text in Postgres statt S3-Bucket
Ursprünglich war ein S3-kompatibler Bucket (Supabase Storage/MinIO) für
Original-Dateien vorgesehen. In der Umsetzung von Phase 2 zeigte sich: der
eigentliche Wert einer Quelle für Quellwerk ist ihr extrahierter Text (für
Anzeige und später RAG), nicht die Original-Datei selbst – "Quelle
anklickbar → Rohtext-Ansicht" laut Plan, nicht "Original-PDF ansehen". Ein
Bucket hätte zusätzliche Infrastruktur (eigener Account, Credentials,
Netzwerk-Fehlerfälle) für einen Anwendungsfall bedeutet, der praktisch nicht
gebraucht wird. Stattdessen: PDF/TXT wird beim Upload serverseitig geparst
(`pdf-parse` v2 für PDF), nur der extrahierte Text landet als `text`-Spalte
auf dem `sources`-Eintrag in Postgres. Vorteil auch fürs Deployment: kein
zusätzlicher Storage-Dienst nötig, funktioniert unverändert auf Render ohne
persistentes Volume.

## 2026-08 – Font-Inlining im Production-Build deaktiviert
Angular versucht im Production-Build standardmäßig, Google-Fonts-CSS zur
Build-Zeit zu inlinen (externer Netzwerk-Call). Deaktiviert
(`optimization.fonts: false`), damit der Build nicht von der Erreichbarkeit
von fonts.googleapis.com zur Build-Zeit abhängt – robuster für CI/CD. Die
Fonts werden weiterhin zur Laufzeit über die `<link>`-Tags in `index.html`
geladen.
