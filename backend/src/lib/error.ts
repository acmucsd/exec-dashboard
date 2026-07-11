export function isError(err: unknown): err is Error {
	return err instanceof Error;
}

export function toError(err: unknown): Error {
	if (err instanceof Error) return err;
	if (typeof err === "string") return new Error(err);
	return new Error(typeof err === "object" ? JSON.stringify(err) : String(err));
}