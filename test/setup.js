import { beforeEach, afterEach } from 'vitest';

// Stub localStorage for all tests
const localStorageStore = {};
const localStorageMock = {
  getItem: (k) => localStorageStore[k] ?? null,
  setItem: (k, v) => { localStorageStore[k] = String(v); },
  removeItem: (k) => { delete localStorageStore[k]; },
  clear: () => { Object.keys(localStorageStore).forEach(k => delete localStorageStore[k]); },
  get length() { return Object.keys(localStorageStore).length; },
  key: (i) => Object.keys(localStorageStore)[i] ?? null,
};

beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageMock,
    writable: true,
    configurable: true,
  });
  localStorageMock.clear();
});

afterEach(() => {
  localStorageMock.clear();
});
