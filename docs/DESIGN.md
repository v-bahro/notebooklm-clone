# Design-System

## Palette
| Token | Hex | Verwendung |
|---|---|---|
| `--paper` | `#F3F1EA` | Seitenhintergrund |
| `--paper-raised` | `#FFFFFF` | Panels/Karten |
| `--ink` | `#23262B` | Primärtext |
| `--ink-soft` | `#5B5F66` | Sekundärtext, Meta-Infos |
| `--accent` | `#2F4A6B` | Interaktive Elemente, aktiver Zustand (Tintenblau) |
| `--highlight` | `#8A9A5B` | Zitat-/Auswahl-Hervorhebung (gedecktes Olive, wie Textmarker) |
| `--rule` | `#DAD5C8` | Trennlinien, Rahmen |

Bewusst kein Terracotta/Orange, kein Gradient, kein Angular-Material-Blau.

## Typografie
- **Display (Titel, Notebook-Namen):** Source Serif 4 – ruhig, literarisch,
  passt zum "Notizbuch"-Charakter, aber ohne die typische AI-generierte
  High-Contrast-Serif-Dramatik.
- **UI-Text:** IBM Plex Sans – neutral, gut lesbar in kleinen Größen.
- **Meta/Daten (Zeitstempel, Dateigröße, Zitat-Indizes):** IBM Plex Mono –
  signalisiert "das ist eine strukturierte Angabe, kein Fließtext".

## Layout
Drei-Spalten-Shell, angelehnt an das NotebookLM-Original:

```
┌───────────┬───────────────────────────┬───────────┐
│  Quellen  │        Arbeitsbereich       │  Studio   │
│  (Rail)   │   (Notebook-Titel + Chat)   │  (Rail)   │
└───────────┴───────────────────────────┴───────────┘
```
Seitliche Rails schmal und ruhig, Fokus liegt auf der Mitte.

## Signatur-Element
Dezente Lineatur (sehr helle horizontale Linien, ca. 28px Abstand, niedrige
Opazität) im Hintergrund des Arbeitsbereichs – Anspielung auf liniertes
Papier, bewusst zurückhaltend statt kitschig.

## Qualitäts-Baseline
- Responsive bis Mobile-Breite (Rails werden auf schmalen Screens einklappbar)
- Sichtbarer Fokus-Ring für Tastaturbedienung
- `prefers-reduced-motion` wird respektiert
