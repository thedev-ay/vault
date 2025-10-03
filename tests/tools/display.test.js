const display = require('../../src/tools/display');

describe('tools/display', () => {
  test('should export banner, accounts, credentials, error', () => {
    expect(typeof display.banner).toBe('function');
    expect(typeof display.accounts).toBe('function');
    expect(typeof display.credentials).toBe('function');
    expect(typeof display.error).toBe('function');
  });
});