const config = require('../../src/tools/config');

describe('tools/config', () => {
  test('should export getVaultData, setVaultData, getBannerColor, setBannerColor', () => {
    expect(typeof config.getVaultData).toBe('function');
    expect(typeof config.setVaultData).toBe('function');
    expect(typeof config.getBannerColor).toBe('function');
    expect(typeof config.setBannerColor).toBe('function');
  });
});