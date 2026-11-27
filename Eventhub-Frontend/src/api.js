const API_BASE = "http://127.0.0.1:8000";
const REFRESH_URL = `${API_BASE}/accounts/token/refresh/`;

// Shared promise: while a refresh is in flight, every 401 waits for the same one.
let refreshPromise = null;

function clearSessionAndRedirect() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  window.location.href = "/";
}

async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refresh = localStorage.getItem("refresh");
    if (!refresh) throw new Error("NO_REFRESH_TOKEN");

    const response = await fetch(REFRESH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });

    if (!response.ok) throw new Error("REFRESH_REJECTED");

    const data = await response.json();
    localStorage.setItem("access", data.access);
    // Only present if ROTATE_REFRESH_TOKENS is enabled in SimpleJWT
    if (data.refresh) localStorage.setItem("refresh", data.refresh);

    return data.access;
  })().finally(() => {
    refreshPromise = null; // allow future refreshes
  });

  return refreshPromise;
}

function sendRequest(url, options, token) {
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

export async function apiFetch(url, options = {}) {
  const response = await sendRequest(
    url,
    options,
    localStorage.getItem("access")
  );

  if (response.status !== 401) return response;

  // Access token rejected: try to refresh once, then retry once.
  let newToken;
  try {
    newToken = await refreshAccessToken();
  } catch (err) {
    if (
      err.message === "NO_REFRESH_TOKEN" ||
      err.message === "REFRESH_REJECTED"
    ) {
      clearSessionAndRedirect();
      throw new Error("Your session has expired. Please log in again.", { cause: err });
    }
    throw err; // network error: don't log the user out
  }

  return sendRequest(url, options, newToken); // retried once, returned as-is
}