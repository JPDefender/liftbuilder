# Contributing to LiftBuilder

## Security Requirements for New Code

The following rules apply to all code merged into this repository starting with Phase 2. Pull requests that violate these rules will not be merged.

---

### 1. No inline event handlers

**Rule:** Do not use `onclick="..."`, `onchange="..."`, `oninput="..."`, `onload="..."`, `onmouseenter="..."`, or any other inline event handler attribute in dynamically generated HTML.

**Why:** Inline handlers in template literals combine user data and executable code in the same string, making it impossible to safely separate data from instructions. They also prevent a Content-Security-Policy `script-src` directive from being applied.

**What to do instead:** Assign a unique `id` or `data-*` attribute to the element and attach the event listener with `addEventListener` after inserting the HTML into the DOM.

```js
// ❌ Forbidden
container.innerHTML = `<button onclick="deleteAthlete(${idx})">Delete</button>`;

// ✅ Required
container.innerHTML = `<button data-idx="${idx}" class="js-delete-athlete">Delete</button>`;
container.querySelector('.js-delete-athlete')
  .addEventListener('click', e => deleteAthlete(+e.currentTarget.dataset.idx));
```

---

### 2. No innerHTML assignment of user-controlled data without sanitization

**Rule:** Never write `element.innerHTML = ... ${userValue} ...` unless `userValue` has been passed through the `esc()` HTML-escaping helper (or an equivalent approved sanitizer).

**Why:** Unescaped `innerHTML` is the primary XSS vector in this codebase. The app stores PII of minor athletes; a stored XSS payload can silently exfiltrate all localStorage data.

**The `esc()` helper** (to be added in Phase 2):
```js
function esc(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
```

**Rules of application:**
- Every string from `state.*` that renders into HTML must go through `esc()`.
- Numeric values computed by the app (not from user input) do not need `esc()`.
- Fixed string constants defined in the source code do not need `esc()`.
- When in doubt, apply `esc()`.

For rich HTML content (e.g., mobility notes that may contain formatting), use DOMPurify instead of `esc()`. DOMPurify will be added as a vendor bundle in Phase 2.

---

### 3. No embedding data in onclick / event handler attribute strings

**Rule:** Never put application data — especially data from `state.*` or `JSON.stringify()` — inside an event handler attribute string.

**Why:** This pattern (seen in `_showProgramSelectModal`, line 4380) embeds attacker-controlled content inside executable JavaScript, creating a trivially exploitable code injection path that is resistant to simple escaping.

**What to do instead:** Use a closure over a variable, or use a `data-*` attribute and look up the data in the handler.

```js
// ❌ Forbidden
`<button onclick="_confirmImportSelected(${JSON.stringify(programs)})">Import</button>`

// ✅ Required
let _pendingImportPrograms = programs;
`<button id="js-confirm-import">Import</button>`
// then: document.getElementById('js-confirm-import').addEventListener('click', () => _confirmImportSelected(_pendingImportPrograms));
```

---

### 4. All new API endpoints extend a base class that requires authentication

*(Applies when the backend is added — Phase 5)*

**Rule:** Every new endpoint handler must extend `AuthenticatedEndpoint` (or equivalent base class). The base class enforces:
- Valid session token verification before executing handler logic
- Object-level authorization check (the requesting user owns the resource)
- No fallback to unauthenticated behavior

There must be no way to reach business logic in an endpoint without passing the auth check.

---

### 5. All new database queries use parameterized queries

*(Applies when a database is added — Phase 5)*

**Rule:** String concatenation into SQL or NoSQL queries is forbidden. All queries must use parameterized statements or an ORM that handles parameterization automatically.

```js
// ❌ Forbidden
db.query(`SELECT * FROM athletes WHERE name = '${name}'`);

// ✅ Required
db.query('SELECT * FROM athletes WHERE name = $1', [name]);
```

---

### 6. All new dependencies pinned to exact versions

**Rule:** New entries in `package.json` must use exact versions. No `^` (caret) or `~` (tilde) version ranges.

**Why:** Ranged version pins allow automatic installation of minor/patch versions that may contain security regressions or supply chain compromises without any developer review.

```json
// ❌ Forbidden
"dompurify": "^3.0.0"

// ✅ Required
"dompurify": "3.1.6"
```

The same rule applies to vendor files committed to `vendor/`: pin to an exact version, update intentionally, and update `CHECKSUMS.sha256` when changing a vendor file.

---

### 7. JSON imports must be sanitized for prototype pollution

**Rule:** Any `JSON.parse()` result that is assigned to application state must be filtered to remove `__proto__`, `constructor`, and `prototype` keys before use.

**Why:** See threat T-006. A crafted import file can corrupt `Object.prototype` and affect all property lookups app-wide.

**What to do:** Use the `sanitizeImport()` helper (to be added in Phase 2) which recursively removes dangerous keys, or validate the parsed object against a schema before assignment.

---

### 8. CSV exports must neutralize formula injection

**Rule:** Any value written to a CSV cell that comes from user-entered data must be prefixed with `'` (single quote) if the value starts with `=`, `+`, `-`, `@`, a tab character, or a carriage return.

**Why:** See threat T-007. Excel and Google Sheets treat these prefix characters as formula indicators.

---

## Pull Request Checklist

Before opening a PR, confirm:

- [ ] No inline event handlers added (`grep -n 'onclick="' index.html` shows no new lines)
- [ ] All new `innerHTML` assignments use `esc()` or DOMPurify for user-controlled strings
- [ ] No new JSON data embedded in event handler attribute strings
- [ ] New dependencies (if any) pinned to exact version in `package.json`
- [ ] `CHECKSUMS.sha256` updated if any vendor file was changed
- [ ] THREATS.md reviewed — does the change introduce any new threat vectors?
