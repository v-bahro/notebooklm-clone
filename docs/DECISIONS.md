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

## 2026-08 – RAG-Chat: zwei Provider (OpenAI Embeddings + Claude API), Modellwahl
Bewusst bei zwei separaten Anbietern geblieben statt auf einen zu konsolidieren
(z. B. beides über OpenAI), obwohl das einen zweiten API-Key bedeutet: Embeddings
und Textgenerierung sind unterschiedliche Aufgaben mit unterschiedlichen
Anforderungen, und `text-embedding-3-small` (OpenAI) ist für reine
Vektorsuche günstig und ausreichend gut, während `claude-opus-5` für die
eigentliche, quellentreue Antwortgenerierung eingesetzt wird – passend zur
"Claude API Integration", die im ursprünglichen Tech-Stack (siehe oben)
ohnehin vorgesehen war. Für eine Testaufgabe im Anthropic-Umfeld ist das
zudem naheliegender als ein Ein-Provider-Setup.

## 2026-08 – pgvector lokal aus Quellcode gebaut statt via Homebrew-Bottle
Das Homebrew-Formula für `pgvector` liefert vorgebaute Bottles nur für
`postgresql@17`/`@18`; dieses Projekt nutzt lokal bewusst `postgresql@16`
(siehe README). Statt die Postgres-Version zu wechseln, wurde `pgvector`
0.8.6 direkt mit `PG_CONFIG` von `postgresql@16` aus dem Quellcode gebaut
und via `make install` in die bestehende Postgres-16-Installation
eingebunden. Für Render (Backend-Hosting) ist das kein Thema, da Render für
Postgres-Add-ons eigene, aktuelle Images mit pgvector-Unterstützung bereitstellt.

## 2026-08 – API-Clients (OpenAI/Claude) lazy statt im Konstruktor instanziiert
`EmbeddingsService` und `ChatService` legen ihren jeweiligen SDK-Client erst
beim ersten tatsächlichen Aufruf an, nicht im NestJS-Konstruktor. Beide SDKs
werfen sofort einen Fehler, wenn kein API-Key auffindbar ist – im Konstruktor
hätte das die komplette App am Start gehindert, sobald `ChatModule`
eingebunden ist, selbst wenn nur ein Key fehlt oder noch nicht gesetzt wurde.
So bleiben Notebook-CRUD und Quellen-Upload immer nutzbar; nur der Chat (bzw.
die Indexierung neuer Quellen) meldet einen klaren, abgefangenen Fehler statt
die App lahmzulegen.

## 2026-08 – Render-Deploy: natives Node-Web-Service statt Docker
Ursprünglich war ein Docker-Deploy auf Render vorgesehen (siehe Tech-Stack-
Tabelle). In der Umsetzung darauf verzichtet: Das Backend hat keine nativen
Abhängigkeiten (auch `pdf-parse` ist reines JS/WASM), die einen eigenen
Container rechtfertigen würden. Render kann Node-Projekte direkt bauen und
starten (`npm install && npm run build` / `npm run start:prod`) – ein
Dockerfile hätte hier nur zusätzliche Wartungsfläche ohne Mehrwert bedeutet.
Passt zur bereits getroffenen Entscheidung "Render statt VPS": minimaler
Ops-Aufwand vor voller Kontrolle. `render.yaml` (Blueprint) definiert DB und
Web-Service deklarativ, damit Vincent nicht jedes Feld einzeln im Dashboard
ausfüllen muss.

## 2026-08 – Postgres-Verbindung: `DATABASE_URL` zusätzlich zu einzelnen DB_*-Vars
Render (wie die meisten Managed-Postgres-Anbieter) stellt eine einzelne
Connection-URL bereit statt einzelner Host/User/Passwort-Variablen.
`AppModule` nutzt jetzt `DATABASE_URL`, wenn gesetzt (mit `ssl:
{rejectUnauthorized: false}`, da Render selbstsignierte Zertifikate
verwendet), und fällt sonst auf die einzelnen `DB_*`-Variablen zurück –
lokale Entwicklung bleibt dadurch unverändert.

## 2026-08 – Render Free-Tier: bewusst akzeptierte Einschränkungen
Sowohl die kostenlose Postgres-Datenbank als auch der kostenlose Web-Service
auf Render haben Einschränkungen (DB läuft nach 30 Tagen ab, Web-Service geht
bei Inaktivität in den Schlaf und braucht beim ersten Request danach ein paar
Sekunden zum Aufwachen). Für die Abgabe dieser Testaufgabe ist das
akzeptabel – ein bezahlter Plan wäre eine bewusste Entscheidung von Vincent,
falls das Projekt über die Bewerbung hinaus länger laufen soll.

## 2026-08 – Font-Inlining im Production-Build deaktiviert
Angular versucht im Production-Build standardmäßig, Google-Fonts-CSS zur
Build-Zeit zu inlinen (externer Netzwerk-Call). Deaktiviert
(`optimization.fonts: false`), damit der Build nicht von der Erreichbarkeit
von fonts.googleapis.com zur Build-Zeit abhängt – robuster für CI/CD. Die
Fonts werden weiterhin zur Laufzeit über die `<link>`-Tags in `index.html`
geladen.
