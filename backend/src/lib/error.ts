export function isError(err: unknown): err is Error {
  return err instanceof Error;
}

export function toError(err: unknown): Error {
  if (err instanceof Error) return err;
  if (typeof err === 'string') return new Error(err);
  // eslint-disable-next-line @typescript-eslint/no-base-to-string
  return new Error(typeof err === 'object' ? JSON.stringify(err) : String(err));
}

export function redactError(err: unknown, secret: string): Error {
  return new Error(toError(err).message.replaceAll(secret, '[redacted]'));
}
