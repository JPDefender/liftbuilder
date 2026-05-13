import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const html = readFileSync(join(process.cwd(), 'index.html'), 'utf-8');

// Inline the function under test (same logic as in index.html)
function validateNoProtoPollution(obj) {
  if (obj === null || typeof obj !== 'object') return;
  const banned = ['__proto__', 'constructor', 'prototype'];
  for (const key of Object.keys(obj)) {
    if (banned.includes(key)) throw new Error('Prototype pollution blocked.');
    validateNoProtoPollution(obj[key]);
  }
}

describe('validateNoProtoPollution()', () => {
  it('passes a clean flat object', () => {
    expect(() => validateNoProtoPollution({ name: 'Alice', wc: '73' })).not.toThrow();
  });

  it('passes a clean nested object', () => {
    expect(() => validateNoProtoPollution({ programs: { p1: { weeks: { 1: {} } } } })).not.toThrow();
  });

  it('passes an array', () => {
    expect(() => validateNoProtoPollution([1, 2, 3])).not.toThrow();
  });

  it('passes null', () => {
    expect(() => validateNoProtoPollution(null)).not.toThrow();
  });

  it('passes a string', () => {
    expect(() => validateNoProtoPollution('hello')).not.toThrow();
  });

  it('blocks __proto__ key', () => {
    const evil = JSON.parse('{"__proto__":{"isAdmin":true}}');
    expect(() => validateNoProtoPollution(evil)).toThrow();
  });

  it('blocks constructor key', () => {
    const evil = JSON.parse('{"constructor":{"prototype":{"isAdmin":true}}}');
    expect(() => validateNoProtoPollution(evil)).toThrow();
  });

  it('blocks prototype key', () => {
    const evil = { prototype: { isAdmin: true } };
    expect(() => validateNoProtoPollution(evil)).toThrow();
  });

  it('blocks __proto__ nested inside program data', () => {
    const evil = {
      teams: {
        team_1: {
          programs: {
            p1: JSON.parse('{"name":"Evil","__proto__":{"x":1}}')
          }
        }
      }
    };
    expect(() => validateNoProtoPollution(evil)).toThrow();
  });

  it('does NOT modify Object.prototype after being called', () => {
    const before = Object.prototype.isAdmin;
    const evil = JSON.parse('{"__proto__":{"isAdmin":true}}');
    try { validateNoProtoPollution(evil); } catch(_) {}
    expect(Object.prototype.isAdmin).toBe(before);
  });
});

describe('JSON import hardening — source-level checks', () => {
  it('importDataJSON has a 5 MB size check', () => {
    const importDataSection = html.slice(html.indexOf('function importDataJSON'));
    expect(importDataSection).toMatch(/file\.size\s*>\s*5\s*\*\s*1024\s*\*\s*1024/);
  });

  it('importDataJSON calls validateNoProtoPollution after JSON.parse', () => {
    const importDataSection = html.slice(html.indexOf('function importDataJSON'));
    expect(importDataSection).toContain('validateNoProtoPollution(data)');
  });

  it('importSharedProgram has a 5 MB size check', () => {
    const section = html.slice(html.indexOf('function importSharedProgram'));
    expect(section).toMatch(/file\.size\s*>\s*5\s*\*\s*1024\s*\*\s*1024/);
  });

  it('importSharedProgram calls validateNoProtoPollution', () => {
    const section = html.slice(html.indexOf('function importSharedProgram'));
    expect(section).toContain('validateNoProtoPollution(data)');
  });

  it('importTemplate has a 5 MB size check', () => {
    const section = html.slice(html.indexOf('function importTemplate'));
    expect(section).toMatch(/file\.size\s*>\s*5\s*\*\s*1024\s*\*\s*1024/);
  });

  it('importTemplate calls validateNoProtoPollution', () => {
    const section = html.slice(html.indexOf('function importTemplate'));
    expect(section).toContain('validateNoProtoPollution(data)');
  });
});
