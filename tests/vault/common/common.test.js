const common = require('../../../src/vault/common');

describe('vault/common', () => {
  test('should export expected functions', () => {
    expect(typeof common).toBe('object');
  });
});