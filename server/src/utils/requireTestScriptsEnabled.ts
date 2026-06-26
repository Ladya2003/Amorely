const TRUTHY = new Set(['1', 'true', 'yes', 'on']);

export const isTestScriptsEnabled = (): boolean => {
  const value = process.env.ENABLE_TEST_SCRIPTS?.trim().toLowerCase();
  return Boolean(value && TRUTHY.has(value));
};

export const requireTestScriptsEnabled = (): void => {
  if (isTestScriptsEnabled()) {
    return;
  }

  console.error(
    'Test scripts are disabled. Set ENABLE_TEST_SCRIPTS=true in server/.env to run this command.'
  );
  process.exit(1);
};
