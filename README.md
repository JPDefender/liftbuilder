# LiftBuilder

A self-contained weightlifting program manager for coaches. Runs entirely in the browser — no server, no sign-in, no dependencies to install.

**Live:** https://JPDefender.github.io/liftbuilder/

## Features

- **Multiple programs** — create, rename, and switch between training programs from the tab bar
- **Weekly program view** — day-by-day workout cards with exercises, sets, reps, and intensity (%1RM)
- **Training phases** — tag each week as Accumulation, Intensification, Realization, or Deload
- **Exercise categories** — Snatch, Clean/Jerk, Squat, Bench, Accessory, Plyo, Core, Other, each color-coded
- **Complex builder** — link multiple movements (e.g. Tempo Snatch Pull + Snatch + OHS) as a single exercise entry
- **Volume dashboard** — per-category volume charts powered by Chart.js; toggle between weeks
- **Peaking timeline** — visual multi-week strip showing phase progression toward a competition date
- **PDF export** — print any week's program to a formatted PDF via jsPDF
- **localStorage persistence** — all data saves automatically in the browser; no account needed

## Usage

Open `index.html` directly in any modern browser, or visit the GitHub Pages link above. Everything runs client-side.

## Dependencies (CDN, no install)

| Library | Version | Purpose |
|---|---|---|
| Chart.js | 4.4.1 | Volume charts |
| jsPDF | 2.5.1 | PDF export |
| Google Fonts (Barlow / Barlow Condensed) | — | Typography |

## Stack

Vanilla HTML + CSS + JavaScript. Single file. No build step.
