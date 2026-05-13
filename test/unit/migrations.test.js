import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const html = readFileSync(join(process.cwd(), 'index.html'), 'utf-8');

describe('localStorage schema versioning', () => {
  it('saveState payload includes schemaVersion field', () => {
    expect(html).toContain('schemaVersion: 1');
  });

  it('loadState handles corrupt JSON with recovery dialog', () => {
    // Verify the nested try/catch exists
    expect(html).toContain('JSON.parse(raw)');
    expect(html).toContain('Saved data appears corrupt');
  });

  it('loadState does not crash on empty localStorage', () => {
    // The null check must come before JSON.parse
    const loadStateBody = html.slice(
      html.indexOf('function loadState()'),
      html.indexOf('function loadState()') + 2000
    );
    const nullCheckPos = loadStateBody.indexOf('if (!raw) return false');
    const parsePos = loadStateBody.indexOf('JSON.parse(raw)');
    expect(nullCheckPos).toBeGreaterThan(-1);
    expect(parsePos).toBeGreaterThan(-1);
    expect(nullCheckPos).toBeLessThan(parsePos);
  });

  it('saveState handles QuotaExceededError by name', () => {
    const saveSection = html.slice(
      html.indexOf('function saveState()'),
      html.indexOf('function saveState()') + 1500
    );
    expect(saveSection).toContain('QuotaExceededError');
  });

  it('QuotaExceededError handler offers to export data', () => {
    const saveSection = html.slice(
      html.indexOf('function saveState()'),
      html.indexOf('function saveState()') + 1500
    );
    expect(saveSection).toContain('exportDataJSON()');
  });
});

describe('Old single-team format migration', () => {
  it('loadState migrates old flat programs format to team_1', () => {
    const loadBody = html.slice(
      html.indexOf('function loadState()'),
      html.indexOf('function loadState()') + 3000
    );
    expect(loadBody).toContain("const teamId = 'team_1'");
    expect(loadBody).toContain('typeof payload.programs');
  });
});
