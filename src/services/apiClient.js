import { apiBaseUrl, memberCsrf } from "./authClient";

export class ApiError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "ApiError";
    this.code = code;
  }
}

export async function apiRequest(path, { method = "GET", body, headers } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  let response;
  const csrf = memberCsrf();
  try {
    response = await fetch(`${apiBaseUrl()}${path}`, {
      method,
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(method !== "GET" && method !== "HEAD" && csrf ? { "X-CSRF-Token": csrf } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch {
    throw new ApiError("NETWORK", "Unable to connect to MOMNT. Please try again.");
  } finally {
    clearTimeout(timer);
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.success === false) {
    throw new ApiError(
      payload?.error?.code || "SERVER_ERROR",
      payload?.error?.message || "Something went wrong. Please try again.",
    );
  }
  return payload;
}
