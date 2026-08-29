const display = require('../../src/tools/display');

describe('tools/display', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    process.exitCode = 0;
  });

  test('should export banner, accounts, credentials, error', () => {
    expect(typeof display.banner).toBe('function');
    expect(typeof display.accounts).toBe('function');
    expect(typeof display.credentials).toBe('function');
    expect(typeof display.error).toBe('function');
  });

  test('should write errors to stderr and set a failure exit code', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    display.error('Operation failed');

    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('Operation failed'));
    expect(process.exitCode).toBe(1);
  });
});
