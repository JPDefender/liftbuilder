import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const html = readFileSync(join(process.cwd(), 'index.html'), 'utf-8');

// Extract csvCell function from index.html
const csvMatch = html.match(/function csvCell\(v\)\s*\{([\s\S]*?)\n\}/);
if (!csvMatch) throw new Error('csvCell() function not found in index.html');
// eslint-disable-next-line no-new-func
const csvCell = new Function('v', csvMatch[1]);

describe('csvCell() formula injection prevention', () => {
  it('prefixes = with single quote', () => {
    expect(csvCell('=SUM(A1:A10)')).toBe("'=SUM(A1:A10)");
  });

  it('prefixes + with single quote', () => {
    expect(csvCell('+cmd|calc')).toBe("'+cmd|calc");
  });

  it('prefixes - with single quote', () => {
    expect(csvCell('-2+3')).toBe("'-2+3");
  });

  it('prefixes @ with single quote', () => {
    expect(csvCell('@SUM(1+2)')).toBe("'@SUM(1+2)");
  });

  it('prefixes tab character with single quote', () => {
    expect(csvCell('\tDDE')).toBe("'\tDDE");
  });

  it('prefixes carriage return with single quote', () => {
    expect(csvCell('\rMalicious')).toBe("'\rMalicious");
  });

  it('passes through safe athlete names unchanged', () => {
    expect(csvCell('John Smith')).toBe('John Smith');
    expect(csvCell('O\'Brien')).toBe("O'Brien");
  });

  it('passes through weight classes unchanged', () => {
    expect(csvCell('73kg')).toBe('73kg');
    expect(csvCell('UNL')).toBe('UNL');
  });

  it('passes through empty string unchanged', () => {
    expect(csvCell('')).toBe('');
  });

  it('coerces null to empty string', () => {
    expect(csvCell(null)).toBe('');
  });

  it('handles numeric values (grad year, snatch max)', () => {
    expect(csvCell(2026)).toBe('2026');
    expect(csvCell(102)).toBe('102');
  });

  it('does NOT neutralize a leading digit (not a formula prefix)', () => {
    expect(csvCell('123abc')).toBe('123abc');
  });
});

describe('exportMeetRosterCSV uses csvCell for athlete data', () => {
  it('athlete name is wrapped with csvCell in meet roster export', () => {
    expect(html).toContain('csvCell(ath.name)');
  });

  it('weight class is wrapped with csvCell in meet roster export', () => {
    expect(html).toMatch(/csvCell\(ath\.wc/);
  });
});
