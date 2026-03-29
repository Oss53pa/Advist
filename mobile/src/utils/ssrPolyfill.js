// SSR Polyfill - This file runs before any other modules
// Polyfills localStorage for Node.js SSR environment

if (typeof globalThis.localStorage === 'undefined') {
  const memoryStorage = {};

  globalThis.localStorage = {
    getItem: (key) => memoryStorage[key] || null,
    setItem: (key, value) => {
      memoryStorage[key] = String(value);
    },
    removeItem: (key) => {
      delete memoryStorage[key];
    },
    clear: () => {
      Object.keys(memoryStorage).forEach((key) => delete memoryStorage[key]);
    },
    get length() {
      return Object.keys(memoryStorage).length;
    },
    key: (index) => Object.keys(memoryStorage)[index] || null,
  };
}

module.exports = {};
