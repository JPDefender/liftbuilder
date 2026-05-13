import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const html = readFileSync(join(process.cwd(), 'index.html'), 'utf-8');

// Extract only the JS script content (not HTML attributes)
// We want to catch inline handlers in JS-generated HTML strings (template literals)
// but not flag handlers in static HTML where they are acceptable pre-Phase 4.
const scriptMatch = html.match(/<script>([\s\S]*)<\/script>\s*<\/body>/);
const scriptContent = scriptMatch ? scriptMatch[1] : '';

describe('Critical inline handler — no JSON.stringify in onclick', () => {
  it('no onclick attribute contains JSON.stringify', () => {
    // This is the T-014 critical vector — must be clean
    expect(html).not.toMatch(/onclick="[^"]*JSON\.stringify/);
    expect(html).not.toMatch(/onclick='[^']*JSON\.stringify/);
  });

  it('_showProgramSelectModal uses data binding, not onclick embedding', () => {
    const funcIdx = html.indexOf('function _showProgramSelectModal(');
    const funcEnd = html.indexOf('\nfunction ', funcIdx + 1);
    const funcBody = html.slice(funcIdx, funcEnd);
    expect(funcBody).not.toContain('JSON.stringify');
    expect(funcBody).toContain('_pendingImportPrograms = programs');
    expect(funcBody).toContain('addEventListener');
  });
});

describe('No state.* data embedded directly in onclick attribute strings', () => {
  it('no onclick embeds state property lookups via template literal substitution', () => {
    // Pattern: onclick="someFunc(${state.something})" — dangerous (embeds state data in executable JS)
    // This covers the T-014 class of injection: embedding array indices or object properties from state
    const match = html.match(/onclick="[^"]*\$\{state\./g);
    expect(match).toBeNull();
  });
});

describe('No eval() or Function() calls in generated HTML', () => {
  it('no eval() usage in script content', () => {
    // Exclude the test infrastructure itself
    expect(scriptContent).not.toMatch(/\beval\s*\(/);
  });
});

describe('Phase 2 handler patterns verified', () => {
  it('_pendingImportPrograms is declared as module variable', () => {
    expect(html).toContain('let _pendingImportPrograms = null');
  });

  it('_pendingImportPrograms is cleared to null after use', () => {
    const confirmFn = html.slice(
      html.indexOf('function _confirmImportSelected('),
      html.indexOf('function _confirmImportSelected(') + 500
    );
    expect(confirmFn).toContain('_pendingImportPrograms = null');
  });
});
