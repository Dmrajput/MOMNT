let csrfToken = "";

function adminBaseUrl() {
  const configured = import.meta.env.VITE_API_BASE_URL;
  if (configured && !import.meta.env.DEV) return String(configured).replace(/\/$/, "");
  return "/api";
}

export function setAdminCsrf(token) {
  csrfToken = token || "";
}

export function adminQuery(params) {
  const search = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "" || value === "all") return;
    search.set(key, String(value));
  });
  const text = search.toString();
  return text ? `?${text}` : "";
}

export async function adminRequest(path, { method = "GET", body, raw = false, session = true } = {}) {
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (method !== "GET" && method !== "HEAD" && csrfToken) headers["X-CSRF-Token"] = csrfToken;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  let response;
  try {
    response = await fetch(`${adminBaseUrl()}${path}`, {
      method,
      credentials: "include",
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch {
    const error = new Error("Unable to connect to MOMNT. Please try again.");
    error.code = "NETWORK";
    throw error;
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 401 && session) {
    window.dispatchEvent(new CustomEvent("momnt-admin-unauthorized"));
  }

  if (raw) {
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const error = new Error(data?.error?.message || "Request failed.");
      error.status = response.status;
      error.code = data?.error?.code;
      throw error;
    }
    return response;
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.error?.message || "Request failed.");
    error.status = response.status;
    error.code = data?.error?.code;
    throw error;
  }
  return data;
}

export function downloadAdminExport(type, params) {
  return adminRequest(`/admin/reports/export${adminQuery({ ...params, type })}`, { raw: true }).then(async (response) => {
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `momnt-${type}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  });
}
