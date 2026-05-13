import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

// Extract esc() from index.html and evaluate it in this context
const html = readFileSync(join(process.cwd(), 'index.html'), 'utf-8');

// Pull out the esc function body from the HTML
const escMatch = html.match(/function esc\(v\)\s*\{([\s\S]*?)\n\}/);
if (!escMatch) throw new Error('esc() function not found in index.html');
// eslint-disable-next-line no-new-func
const esc = new Function('v', escMatch[1]);

describe('esc() HTML escaping helper', () => {
  it('escapes & to &amp;', () => {
    expect(esc('a & b')).toBe('a &amp; b');
  });

  it('escapes < to &lt;', () => {
    expect(esc('<script>')).toBe('&lt;script&gt;');
  });

  it('escapes > to &gt;', () => {
    expect(esc('a > b')).toBe('a &gt; b');
  });

  it('escapes " to &quot;', () => {
    expect(esc('"quoted"')).toBe('&quot;quoted&quot;');
  });

  it("escapes ' to &#39;", () => {
    expect(esc("it's")).toBe('it&#39;s');
  });

  it('blocks basic XSS payload', () => {
    const payload = '<img src=x onerror=alert(1)>';
    expect(esc(payload)).not.toContain('<img');
    expect(esc(payload)).toBe('&lt;img src=x onerror=alert(1)&gt;');
  });

  it('blocks script injection', () => {
    const payload = '"><script>alert(1)</script>';
    expect(esc(payload)).not.toContain('<script>');
  });

  it('handles null/undefined safely', () => {
    expect(esc(null)).toBe('');
    expect(esc(undefined)).toBe('');
  });

  it('returns empty string for empty input', () => {
    expect(esc('')).toBe('');
  });

  it('passes through safe strings unchanged', () => {
    expect(esc('Hello World 123')).toBe('Hello World 123');
  });

  it('coerces numbers to strings', () => {
    expect(esc(42)).toBe('42');
  });
});

describe('esc() applied to athlete PII fields in index.html', () => {
  it('athlete name is escaped before innerHTML insertion', () => {
    expect(html).toContain('${esc(a.name)}');
  });

  it('athlete gender is escaped before innerHTML insertion', () => {
    expect(html).toContain('${esc(a.gender)');
  });

  it('athlete weight class is escaped before innerHTML insertion', () => {
    expect(html).toContain('${esc(a.wc)');
  });

  it('athlete graduation year is escaped before innerHTML insertion', () => {
    expect(html).toContain('${esc(a.gradYear)');
  });

  it('athlete team is escaped before innerHTML insertion', () => {
    expect(html).toContain('${esc(a.team)');
  });

  it('exercise name is escaped in program view', () => {
    expect(html).toContain('${esc(ex.name)');
  });

  it('exercise note is escaped in program view', () => {
    expect(html).toContain('${esc(ex.note)}');
  });

  it('week note is escaped in program view', () => {
    expect(html).toContain('${esc(wd.note)}');
  });

  it('program name is escaped in sidebar', () => {
    expect(html).toContain('${esc(p.name)}');
  });

  it('program org is escaped in sidebar', () => {
    expect(html).toContain('esc(org)');
  });

  it('day focus is escaped in day card', () => {
    expect(html).toContain('esc(dd.focus)');
  });

  it('day note is escaped in day card', () => {
    expect(html).toContain('${esc(dayNote)}');
  });

  it('CSV preview cells are escaped', () => {
    expect(html).toContain('${esc(p)}</td>');
  });

  it('CSV file error message is escaped', () => {
    expect(html).toContain('${esc(err.message)}');
  });

  it('input value= attributes are escaped (openEditProgram)', () => {
    expect(html).toContain('value="${esc(p.name)}"');
    expect(html).toContain('value="${esc(p.org');
    expect(html).toContain('value="${esc(p.season');
  });

  it('superset exercise name value= attribute is escaped', () => {
    expect(html).toContain('value="${esc(se.name');
  });

  it('complex movement name value= attribute is escaped', () => {
    expect(html).toContain('value="${esc(m.name)}"');
  });
});

describe('Critical site #66 — _showProgramSelectModal', () => {
  it('does NOT embed JSON.stringify(programs) in an onclick attribute', () => {
    expect(html).not.toMatch(/onclick="[^"]*JSON\.stringify/);
  });

  it('uses id="js-confirm-import-btn" instead', () => {
    expect(html).toContain('id="js-confirm-import-btn"');
  });

  it('attaches listener via addEventListener, not onclick', () => {
    expect(html).toContain("addEventListener('click', () => _confirmImportSelected(_pendingImportPrograms))");
  });

  it('declares _pendingImportPrograms module variable', () => {
    expect(html).toContain('let _pendingImportPrograms = null');
  });
});
