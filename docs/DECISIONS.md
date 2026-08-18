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
