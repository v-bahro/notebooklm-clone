# Loom-Video – Regieanweisung & Talking Points

Für dich als Grundlage für dein eigenes Skript, nicht zum Ablesen. Ziel:
max. 10 Minuten, Fokus auf dem Teil, der am meisten Ingenieurstiefe zeigt
(RAG-Pipeline), nicht auf jedem einzelnen Klick.

**Zwei Optionen für die Aufnahme-Umgebung:** entweder die Live-URLs
(`https://notebooklm-cloned.netlify.app`) – zeigt, dass es wirklich deployed
ist, aber der Backend-Coldstart kann die erste Chat-Antwort ein paar
Sekunden verzögern – oder lokal (`npm run start:dev` + `npm start`), dafür
kurz erwähnen, dass es auch live läuft und den Link im Video-Titel/Text
angeben. Bei den Live-URLs: einmal kurz vorher "aufwecken" (Seite laden),
bevor du aufnimmst, damit der Cold-Start nicht mitten im Video passiert.

---

## 0. Intro (~20–30 Sek.)

- Wer du bist, worum es geht: "NotebookLM-Klon für die everlast-Testaufgabe"
- Ein Satz Stack: "Angular-Frontend, NestJS-Backend, Postgres mit pgvector
  für die Vektorsuche, RAG-Chat über die Claude API"
- Ein Satz Scope: "Kern-Feature ist der Chat mit den eigenen Quellen –
  Antworten ausschließlich aus den Quellen, mit exaktem Zitat zurück zur
  Textstelle"

## 1. Notebook-Übersicht + anlegen (~30–40 Sek.)

- Übersichtsseite zeigen, kurz das Design-System erwähnen: *"bewusst kein
  Standard-KI-Look – kein Creme+Terracotta-Muster, kein
  Angular-Material-Default, eigenes Papier-Design"*
- Notebook anlegen, umbenennen zeigen (Inline-Editing, kein `window.prompt`)

## 2. Quellen hochladen (~45–60 Sek.)

- Eine PDF hochladen **und** Text einfügen zeigen (beide Wege)
- Eine Quelle anklicken → Rohtext-Ansicht
- *Warum keine Datei-Speicherung/S3:* **"Der eigentliche Wert einer Quelle
  ist ihr extrahierter Text – für Anzeige und RAG, nicht die Originaldatei.
  Deshalb landet nur der geparste Text in Postgres, kein separater
  Storage-Dienst nötig."**

## 3. RAG-Chat – der Kern des Videos (~2–2,5 Min.)

Das ist der Teil, der am meisten zeigt – hier nicht sparen.

- Eine Frage stellen, die eine Quelle klar beantwortet → Antwort mit `[1]`
  o.ä. Zitat zeigen
- **Auf ein Zitat klicken** → Quelle öffnet sich, exakte Textstelle ist
  markiert. Das ist der Clou: nicht nur "aus Quelle X", sondern die genaue
  Zeichenposition.
- Optional, wenn Zeit bleibt: eine Frage stellen, die **nicht** in den
  Quellen steht → zeigen, dass das System das offen sagt statt zu
  halluzinieren
- Talking Points (kurz, in eigenen Worten):
  - Chunking beim Upload: ~1000 Zeichen mit Overlap, wortgrenzen-bewusst
  - OpenAI-Embeddings pro Chunk, gespeichert in Postgres via `pgvector`
  - Bei einer Frage: Frage wird selbst embedded, Cosine-Similarity-Suche
    liefert die Top-6-Chunks **aus diesem Notebook**
  - Prompt an Claude enthält nummerierte Ausschnitte, System-Prompt zwingt
    zu Zitaten und verbietet Antworten außerhalb der Quellen
  - Antwort wird geparst (`[n]`-Muster), jede Zitatnummer auf Chunk +
    Zeichen-Offset zurückgeführt → das treibt die Highlight-Funktion
  - *Warum zwei API-Provider (OpenAI + Anthropic) statt einem:* **"Embedding
    und Textgenerierung sind unterschiedliche Aufgaben – `text-embedding-
    3-small` ist günstig und für reine Vektorsuche ausreichend, `claude-
    opus-5` übernimmt die eigentliche, quellentreue Antwortgenerierung."**

## 4. Studio: Zusammenfassung (~20–30 Sek.)

- Button klicken, Zusammenfassung entstehen lassen
- Kurz erwähnen: ein einzelner Claude-Call über alle Quellen; Audio Overview
  ist bewusst nicht gebaut (Aufwand für Zwei-Stimmen-TTS steht in keinem
  Verhältnis zum Nutzen fürs Video/die Bewertung) – als Roadmap-Punkt nennen

## 5. Architektur (~2–2,5 Min.)

Hier `docs/ARCHITECTURE.md` auf GitHub zeigen (Mermaid-Diagramme rendern
dort automatisch) oder die Diagramme aus dem Screen teilen.

- System-Diagramm zeigen: Angular (Netlify) → NestJS (Render) → Postgres
  + pgvector, plus die zwei externen APIs
- Datenmodell kurz zeigen (ER-Diagramm): Notebook → Source → Chunk,
  Notebook → Message; `embedding`-Spalte über Rohdaten-SQL statt TypeORM-
  Decorator (pgvector hat kein natives TypeORM-Mapping)
- Resilienz-Muster hervorheben – zeigt Produktionsdenken, nicht nur "läuft
  bei mir": **"Beide LLM-Clients werden lazy instanziiert – ein fehlender
  API-Key legt nicht die ganze App lahm, nur die betroffene Funktion meldet
  einen klaren Fehler. Auch das pgvector-Setup beim Start ist
  fehlertolerant."**
- 2–3 bewusste Vereinfachungen nennen (nicht alle – Auswahl):
  - Kein Auth-System: **"Zeit bewusst in RAG-Qualität und UI gesteckt statt
    in Login/Sessions/Rollen – die eigentliche Aufgabenstellung war der
    NotebookLM-Klon, nicht ein Auth-System."**
  - State-Management: Signals statt NgRx – *"Datenfluss ist einfach genug,
    NgRx wäre Boilerplate ohne Mehrwert für diesen Umfang."*
  - Kein Docker fürs Backend, obwohl ursprünglich geplant: *"Keine nativen
    Abhängigkeiten im Backend – Render baut Node-Projekte direkt, ein
    Dockerfile hätte nur Wartungsfläche ohne Mehrwert bedeutet."*

## 6. Live-Deployment (~20–30 Sek.)

- Kurz zeigen, dass es unter der echten URL läuft (falls nicht schon als
  Aufnahme-Umgebung genutzt)
- Erwähnen: `render.yaml`/`netlify.toml` im Repo – Deployment ist
  deklarativ, jeder Push auf `main` deployt beide Seiten automatisch neu

## 7. Abschluss (~20–30 Sek.)

- Kurzes Fazit: was funktioniert (RAG-Chat mit exakten Zitaten, live
  deployed)
- Was als Nächstes käme, wenn mehr Zeit wäre: Audio Overview, Auth-System,
  mehrsprachige Antworten
- Danke fürs Anschauen / Link zum Repo

---

## Zeitbudget-Übersicht

| Abschnitt | Dauer |
|---|---|
| Intro | 0:20–0:30 |
| Notebook-Übersicht | 0:30–0:40 |
| Quellen hochladen | 0:45–1:00 |
| **RAG-Chat (Kern)** | **2:00–2:30** |
| Zusammenfassung | 0:20–0:30 |
| Architektur | 2:00–2:30 |
| Live-Deployment | 0:20–0:30 |
| Abschluss | 0:20–0:30 |
| **Gesamt** | **~7–8:30 Min.** |

Puffer bis zur 10-Minuten-Grenze für Versprecher/Nachfragen einplanen.

## Falls Fragen aus dem Video kommen könnten (Vorbereitung)

- *"Warum kein NgRx?"* → Datenfluss einfach genug, Signals reichen.
- *"Warum zwei LLM-Provider?"* → siehe Abschnitt 3 oben.
- *"Warum kein S3 für Original-Dateien?"* → siehe Abschnitt 2 oben.
- *"Wie skaliert die Vektorsuche?"* → Suche ist immer auf ein Notebook
  begrenzt (`WHERE notebook_id = …`), pgvector-Index wäre der nächste
  Schritt bei größeren Datenmengen (aktuell kein Index nötig, Datenmenge zu
  klein für den Unterschied).
- *"Was hat am längsten gedauert?"* → deine eigene Einschätzung, aber die
  RAG-Pipeline (Chunking/Embeddings/Retrieval/Zitat-Mapping) war der
  komplexeste Teil, nicht das CRUD drumherum.
