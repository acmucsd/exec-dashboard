export class HttpError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

const errorMessageFrom = async (response: Response, fallback: string) => {
  const body: unknown = await response.json().catch(() => null);
  if (typeof body === "object" && body !== null && "message" in body) {
    const message = body.message;
    if (typeof message === "string") {
      const failures =
        "failures" in body && Array.isArray(body.failures)
          ? body.failures.flatMap((failure: unknown) =>
              typeof failure === "object" &&
              failure !== null &&
              "email" in failure &&
              typeof failure.email === "string" &&
              "error" in failure &&
              typeof failure.error === "string"
                ? [`${failure.email}: ${failure.error}`]
                : [],
            )
          : [];
      return [message, ...failures].join("\n");
    }
    if (Array.isArray(message)) return message.join(", ");
  }
  return fallback;
};

const request = async (
  url: string,
  fallback: string,
  init?: RequestInit,
  emptyBody = false,
): Promise<unknown> => {
  const response = await fetch(url, init);

  if (!response.ok) {
    throw new HttpError(
      await errorMessageFrom(response, fallback),
      response.status,
    );
  }

  return emptyBody ? null : await response.json();
};

const jsonRequest = (
  method: "POST" | "PUT" | "PATCH",
  url: string,
  fallback: string,
  body?: unknown,
  headers?: Record<string, string>,
) =>
  request(
    url,
    fallback,
    body === undefined
      ? { method, headers }
      : {
          method,
          headers: { "Content-Type": "application/json", ...headers },
          body: JSON.stringify(body),
        },
  );

export const get = (url: string, fallback: string) => request(url, fallback);

export const post = jsonRequest.bind(null, "POST");
export const put = jsonRequest.bind(null, "PUT");
export const patch = jsonRequest.bind(null, "PATCH");

// delete is a reserved keyword
export const httpDelete = (
  url: string,
  fallback: string,
  headers?: Record<string, string>,
) => request(url, fallback, { method: "DELETE", headers }, true);
