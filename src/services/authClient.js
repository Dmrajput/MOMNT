let csrfToken = "";

export function setMemberCsrf(token) {
  csrfToken = token || "";
}

export function memberCsrf() {
  return csrfToken;
}

export function apiBaseUrl() {
  const configured = import.meta.env.VITE_API_BASE_URL;
  if (configured && !import.meta.env.DEV) return String(configured).replace(/\/$/, "");
  return "/api";
}
