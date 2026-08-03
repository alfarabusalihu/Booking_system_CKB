export const log = (scope: string, msg: string): void => {
  process.stdout.write(`[${new Date().toISOString()}] [${scope}] ${msg}\n`);
};

export const err = (scope: string, msg: string, error?: unknown): void => {
  process.stderr.write(`[${new Date().toISOString()}] [${scope}] ERROR: ${msg}\n`);
  if (error) process.stderr.write(`  ${String(error)}\n`);
};
