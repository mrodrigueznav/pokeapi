export function logInfo(message: string, meta?: Record<string, unknown>): void {
  const timestamp = new Date().toISOString();
  if (meta) {
    console.log(`[${timestamp}] INFO: ${message}`, meta);
  } else {
    console.log(`[${timestamp}] INFO: ${message}`);
  }
}

export function logError(message: string, error?: unknown): void {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ERROR: ${message}`, error);
}

export function logWarn(message: string, meta?: Record<string, unknown>): void {
  const timestamp = new Date().toISOString();
  if (meta) {
    console.warn(`[${timestamp}] WARN: ${message}`, meta);
  } else {
    console.warn(`[${timestamp}] WARN: ${message}`);
  }
}
