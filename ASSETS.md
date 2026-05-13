# ASSETS.md — Data Asset Catalog

**Project:** LiftBuilder v3.2.4  
**Classification framework:** NIST SP 800-60 Vol. II  
**Date:** 2026-05-13  
**Status:** Phase 1 — Initial catalog (no auth/session layer yet)

---

## Sensitivity Classification Key

| Level | Definition |
|-------|-----------|
| **Public** | Visible to any user; no harm if disclosed (app name, version) |
| **Internal** | Visible to any authenticated user; default exercise library content |
| **Confidential** | Accessible only to the coach operating the app; program structure, coach notes |
| **Restricted** | PII of minors; direct or indirect identifiers that could identify a student-athlete |

FERPA relevance: the app stores "education records" as defined by 20 U.S.C. § 1232g when used in a school athletic context. Any record that can be linked to an individually identifiable student is a FERPA education record.

---

## Asset Catalog

| # | Asset | Sensitivity | FERPA PII? | Where it enters | Where it's stored | Where it egresses |
|---|-------|-------------|------------|-----------------|-------------------|-------------------|
| A-01 | **Athlete name** | Restricted | Yes — direct identifier | Roster form (`#af-name`, line 3443); CSV import (`parseCSV`, line 3488); JSON backup import (`importDataJSON`, line 4432) | `localStorage['liftbuilder_v1']` → `teams[id].roster.athletes[].name` | PDF roster export (`exportRosterPDF`, line 3896); meet roster CSV export (`exportMeetRosterCSV`, line 3131); JSON backup (`exportDataJSON`, line 4411); per-program JSON share (`shareProgram`, line 4314); roster table in DOM (unescaped `innerHTML`, line 3350) |
| A-02 | **Athlete gender** | Restricted | Yes — indirect identifier (combined with other fields uniquely identifies athlete) | Roster form (`#af-gender`); CSV import | `localStorage` → `athletes[].gender` | PDF roster; JSON backup; DOM roster table (line 3351) |
| A-03 | **Athlete weight class** | Restricted | Yes — indirect identifier | Roster form (`#af-wc`); CSV import | `localStorage` → `athletes[].wc` | PDF roster; CSV export; JSON backup; meet detail view DOM |
| A-04 | **Athlete graduation year** | Restricted | Yes — indirect identifier (narrows age bracket of a minor) | Roster form (`#af-gradYear`); CSV import | `localStorage` → `athletes[].gradYear` | PDF roster; JSON backup; DOM roster table |
| A-05 | **Athlete training maxes** (Snatch, C&J, Bench, Jerk, FSQ, BSQ, custom fields) | Restricted | Yes — indirect identifier when combined with name | Roster form (`#af-snatch`, `#af-cj`, `#af-bench`, etc.); CSV import; meet results (PR auto-update, line 3107) | `localStorage` → `athletes[].snatch`, `.cj`, `.bench`, etc. | PDF roster; JSON backup; Calculator tab (DOM); Attempts tab (DOM); meet detail view |
| A-06 | **Athlete meet results** (attempt weights, made/missed per lift, division) | Restricted | Yes — indirect identifier; performance records are education records | Meet detail form (inline `<input>` at line 2923); meet division select | `localStorage` → `teams[id].meets[].entries[]` | Meet roster CSV export; JSON backup; meet detail view DOM |
| A-07 | **Athlete team assignment** (Varsity / JV) | Restricted | Yes — indirect identifier | Roster form (`#af-team`); CSV import | `localStorage` → `athletes[].team` | PDF roster; JSON backup; DOM |
| A-08 | **Program name** | Confidential | No | New program form (`#np-name`, line 1596); edit program form | `localStorage` → `programs[id].name` | PDF export header; JSON share filename; program list DOM (unescaped, line 495) |
| A-09 | **Organization / school name** | Confidential | No | New program form (`#np-org`); edit program form | `localStorage` → `programs[id].org` | PDF export; JSON share; sidebar DOM (unescaped, line 506); drives theme color via `applyTheme()` |
| A-10 | **Season / year label** | Confidential | No | New program form (`#np-season`) | `localStorage` → `programs[id].season` | PDF export; JSON share |
| A-11 | **Exercise names** | Confidential | No | Add/edit exercise modal (`#m-name`); CSV import not applicable; exercise library; JSON import | `localStorage` → `weeks[w].days[d].exercises[].name` | PDF export; JSON share; program view DOM (unescaped, line 651); calendar view DOM (line 2555) |
| A-12 | **Exercise coaching notes** | Confidential | No — but may contain PII if coach writes athlete-specific notes | Add/edit exercise modal (`#m-note`); JSON import | `localStorage` → `exercises[].note` | PDF export (prints on PDF); JSON share; program view DOM (unescaped, line 649) |
| A-13 | **Week notes / coach notes** | Confidential | No — same caveat as A-12 | Add week modal (`#m-note`); JSON import | `localStorage` → `weeks[w].note` | PDF export; JSON share; program view DOM (unescaped, line 618) |
| A-14 | **Day notes / session focus** | Confidential | No | Edit day modal (`#ed-focus`, `#ed-daynote`, `#ed-mob`); JSON import | `localStorage` → `days[d].focus`, `.dayNote`, `.mobility` | PDF export (mobility printed); JSON share; program view DOM (unescaped, lines 722, 730) |
| A-15 | **Template names** | Confidential | No | Template name modal (`#tpl-name`); JSON template import | `localStorage` → `templates[].name` | Template JSON export; templates list DOM (unescaped, line 3954) |
| A-16 | **Team names** | Confidential | No | New/rename team modal (`#new-team-name`, `#rename-team-name`) | `localStorage` → `teams[id].name` | JSON backup; sidebar team selector DOM (in `<option>`, line 519) |
| A-17 | **Meet names, dates, locations** | Confidential | No — but location combined with date links to a student athlete's competitive record | Meet form (`#meet-name`, `#meet-date`, `#meet-loc`) | `localStorage` → `meets[].name`, `.date`, `.location` | JSON backup; meet roster CSV; meet list DOM (unescaped, line 2871) |
| A-18 | **Custom roster field definitions** | Confidential | No | Manage fields modal (`#new-field-name`) | `localStorage` → `roster.customFields[]` | JSON backup; roster PDF; DOM |
| A-19 | **JSON backup file** | Restricted | Yes — contains full roster with all Restricted fields above | `exportDataJSON()` trigger (line 4411) | Local filesystem (coach's device) | N/A after download; file contains entire state tree |
| A-20 | **Per-program JSON share file** | Confidential | No (no athlete PII unless coach embedded athlete names in notes) | `shareProgram()` trigger (line 4314) | Local filesystem | N/A after download; may contain exercise notes |
| A-21 | **Meet roster CSV file** | Restricted | Yes — athlete name + weight class + division | `exportMeetRosterCSV()` trigger (line 3131) | Local filesystem | N/A after download |
| A-22 | **Roster PDF** | Restricted | Yes — full athlete records including training maxes | `exportRosterPDF()` trigger (line 3896) | Local filesystem | N/A after download |
| A-23 | **Program PDF** | Confidential | No — unless coach notes contain athlete names | `exportWeekPDF()` / `exportFullProgramPDF()` | Local filesystem | N/A after download |
| A-24 | **Exercise library** | Internal | No | Add to library modal; default library load; JSON import | `localStorage` → `exerciseLibrary[]` | JSON backup; library view DOM |
| A-25 | **App version** | Public | No | Injected by Electron preload (`api.getVersion()`) | DOM (`#app-version`) | DOM display; no export |
| A-26 | **Weight unit preference** (lbs/kg) | Internal | No | Unit toggle buttons | `localStorage` → `weightUnit` | JSON backup |
| A-27 | **User credentials / session tokens** | N/A (Phase 1 — no auth yet) | N/A | Planned for cloud phase | Planned: secure storage | Planned: HTTPS only |
| A-28 | **CSV import file** (roster) | Restricted | Yes — contains athlete PII in transit | File upload input (`#csv-file-input`, line 3540) | Never persisted directly; parsed in-memory then stored via `saveState()` | N/A — processed in browser memory only |
| A-29 | **Undo snapshot** | Restricted | Yes — copy of full prior state, same sensitivity as localStorage payload | In-memory `_undoSnapshot` variable (line 4192) | JavaScript heap (tab lifetime only) | Never exported |
| A-30 | **Planned weeks / periodization targets** | Confidential | No | Peaking tab inputs | `localStorage` → `programs[id]._plannedWeeks[]` | JSON share; JSON backup |

---

## FERPA PII Summary

Direct identifiers (individually sufficient to identify a student):
- A-01 (athlete name)

Indirect identifiers (individually insufficient but dangerous in combination):
- A-02 (gender) + A-03 (weight class) + A-04 (grad year) + A-07 (team) — this combination can uniquely identify a minor athlete
- A-05 (training maxes) combined with A-01 constitutes a performance education record
- A-06 (meet results) is a competitive record linked to an identified athlete

**Risk note:** A JSON backup (A-19) or a PDF roster (A-22) constitutes a portable FERPA education record. If exported to an unprotected location, shared via unencrypted email, or stored in a shared cloud drive, the school's FERPA obligations extend to those copies.
