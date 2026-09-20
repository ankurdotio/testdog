describe('Configuration validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test('throws an error when JWT_SECRET is missing outside testing environment', async () => {
    process.env.NODE_ENV = 'development';
    delete process.env.JWT_SECRET;

    await expect(import('../config/config.js')).rejects.toThrow(
      'FATAL: JWT_SECRET is required but not set in environment.'
    );
  });

  test('allows missing JWT_SECRET in testing environment', async () => {
    process.env.NODE_ENV = 'testing';
    delete process.env.JWT_SECRET;

    const { default: config } = await import('../config/config.js');

    expect(config.JWT_SECRET).toBeUndefined();
  });

  test('loads JWT_SECRET when it is provided', async () => {
    process.env.NODE_ENV = 'development';
    process.env.JWT_SECRET = 'test-secret';

    const { default: config } = await import('../config/config.js');

    expect(config.JWT_SECRET).toBe('test-secret');
  });
});
