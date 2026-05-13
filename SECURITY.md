# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 3.x (current) | ✅ Active development |
| 2.x | ❌ End of life |
| < 2.0 | ❌ End of life |

---

## Reporting a Vulnerability

If you discover a security vulnerability in LiftBuilder, please report it responsibly.

**Contact:** jacob.phillips37@live.com  
**Subject line:** `[LiftBuilder Security] <brief description>`

Please include:
- A description of the vulnerability and affected component
- Steps to reproduce (proof-of-concept if possible)
- Potential impact (what data or functionality is affected)
- Your suggested mitigation (optional)

**Response SLA:**
- Acknowledgment within 48 hours
- Initial triage within 7 days
- Fix timeline communicated within 14 days

**Please do not** file public GitHub issues for security vulnerabilities until a fix has been released.

---

## Security Update Policy

- Critical vulnerabilities (RCE, full PII exfiltration): patch released within 7 days
- High vulnerabilities (XSS, data tampering): patch released within 30 days
- Medium/Low vulnerabilities: addressed in the next scheduled release

Security patches will be tagged with the suffix `-security` in the release notes (e.g., `v3.2.5-security`).

---

## Threat Model Summary

The full threat model is documented in [`THREATS.md`](THREATS.md).

**Current architecture:** Single-file SPA (index.html), vanilla JS, localStorage persistence, optional Electron desktop wrapper. No backend. No network requests. No authentication layer (Phase 1).

**Primary risk surface:** The app stores FERPA-adjacent PII of minor athletes (names, weight classes, graduation years, training maxes, meet results) in browser localStorage with no encryption.

**Phase 2 (implemented 2026-05-13):**
- Output encoding via `esc()` applied to all user-controlled innerHTML sites (T-001–T-005, T-013, T-018)
- Critical T-014 refactor: `_showProgramSelectModal` no longer embeds `JSON.stringify(programs)` in onclick attribute; uses `_pendingImportPrograms` module variable + `addEventListener`
- Prototype pollution blocked in all three JSON import paths via `validateNoProtoPollution()` (T-006)
- 5 MB size cap on all JSON/file imports (T-009)
- CSV formula injection neutralization via `csvCell()` on all export paths (T-007)
- localStorage QuotaExceededError → confirm-to-export dialog
- Corrupt localStorage recovery dialog with offer to clear and reload
- `schemaVersion: 1` field added to localStorage payload (migration scaffold)
- DOMPurify 3.1.6 vendored to `vendor/purify.min.js`; `sanitizeHTML()` helper available for future rich-text sites
- 97-test security suite (`npm test`): xss, csv-injection, json-import, migrations, inline-handlers, innerHTML-audit
- Vendor SHA-256 checksums in `CHECKSUMS.sha256`; CI verifies on every push
- All npm dependencies pinned to exact versions; CI runs `npm audit --audit-level=high`
- GitHub Actions CI: security tests, npm audit, vendor integrity, gitleaks secret scan

For the full asset catalog, see [`ASSETS.md`](ASSETS.md).

---

## NIST SP 800-53 Rev. 5 Control Implementation Status

| Control ID | Control Name | Status | Phase |
|-----------|--------------|--------|-------|
| AC-2 | Account Management | Phase 5 — Planned | Phase 5 (backend auth) |
| AC-3 | Access Enforcement | Phase 5 — Planned | Phase 5 (IDOR prevention, RBAC) |
| AC-7 | Unsuccessful Logon Attempts | Phase 5 — Planned | Phase 5 (rate limiting) |
| AC-12 | Session Termination | Phase 5 — Planned | Phase 5 (session timeout) |
| AU-2 | Event Logging | Phase 5 — Planned | Phase 5 (server-side audit log) |
| AU-3 | Content of Audit Records | Phase 5 — Planned | Phase 5 |
| AU-9 | Protection of Audit Information | Phase 5 — Planned | Phase 5 |
| IA-2 | Identification and Authentication | Phase 5 — Planned | Phase 5 (user auth) |
| IA-5 | Authenticator Management | Phase 5 — Planned | Phase 5 (password policy, MFA) |
| SC-8 | Transmission Confidentiality and Integrity | Phase 5 — Planned | Phase 5 (HTTPS enforcement) |
| SC-13 | Cryptographic Protection | Phase 4 — Planned | Phase 4 (localStorage encryption) |
| SC-23 | Session Authenticity | Phase 5 — Planned | Phase 5 (CSRF protection, SameSite cookies) |
| SC-28 | Protection of Information at Rest | Phase 4 — Planned | Phase 4 (localStorage encryption) |
| SI-10 | Information Input Validation | Phase 2 — Implemented | `esc()` on all innerHTML sites; `validateNoProtoPollution()` on all JSON imports; DOMPurify vendored |
| SI-11 | Error Handling | Phase 2 — Implemented | Generic error messages on import failures; `esc(err.message)` before DOM insertion |
| SI-15 | Information Output Filtering | Phase 2 — Implemented | `csvCell()` neutralizes formula-injection prefixes on all CSV export paths |

---

## Security Testing Approach

**Phase 2 automated tests** (`npm test` — 97 tests, all passing):

| Test file | What it verifies |
|-----------|-----------------|
| `test/security/xss.test.js` | `esc()` escapes all five HTML special chars; all known PII fields use `esc()` in innerHTML; T-014 critical refactor verified |
| `test/security/csv-injection.test.js` | `csvCell()` neutralizes `=`, `+`, `-`, `@`, tab, CR prefixes; safe values pass through unchanged |
| `test/security/json-import.test.js` | `validateNoProtoPollution()` blocks `__proto__`, `constructor`, `prototype`; all three import paths have 5 MB cap and pollution check |
| `test/unit/migrations.test.js` | `schemaVersion` field present; corrupt-data recovery dialog present; old single-team format migration path verified |
| `test/unit/inline-handlers.test.js` | No `JSON.stringify` in onclick attributes; `_pendingImportPrograms` pattern correct; no `${state.*}` in onclick |
| `test/unit/innerHTML-audit.test.js` | All known threat-vector fields (T-001–T-018) use `esc()`; all five security helpers present; DOMPurify vendored |

**Run tests:**
```bash
npm test                  # full suite
npm run test:security     # security-only subset
```

**Manual testing checklist (Phase 2):**
- [ ] Import a JSON file containing `{"__proto__":{"isAdmin":true}}` — should be rejected
- [ ] Import a JSON file > 5 MB — should show "File too large" alert
- [ ] Create an athlete named `<img src=x onerror=alert(1)>` — should render as literal text in roster table
- [ ] Create a program named `"><script>alert(1)</script>` — should render as literal text in sidebar
- [ ] Export meet roster CSV; open in Excel; verify `=SUM(...)` athlete name shows as `'=SUM(...)` in cell
- [ ] Fill localStorage until quota exceeded; attempt to save — should offer export dialog

**Vendor bundle integrity** (`CHECKSUMS.sha256`): SHA-256 hashes for all three vendor files. Regenerate after any vendor update:
```bash
openssl dgst -sha256 vendor/<file>
```
CI verifies all hashes on every push.

**Penetration test** (Phase 5): Full penetration test when backend is deployed, covering IDOR, CSRF, authentication, and session management.

---

## Incident Response

<!-- TODO: Link to INCIDENT_RESPONSE.md when it exists -->

In the event of a suspected data breach involving student athlete PII:

1. Immediately notify the school's data privacy officer or FERPA coordinator
2. Preserve evidence (export localStorage before clearing; note what data was exposed)
3. Notify affected families per FERPA breach notification requirements
4. File a report at the contact address above

A full incident response playbook will be documented in `INCIDENT_RESPONSE.md` (Phase 3).
