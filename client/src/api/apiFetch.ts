import { clearTokens, getToken, setToken } from "./tokenApi";

const API_REFRESH_URL = "/api/auth/token/refresh/";

let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refresh = getToken("refresh");
  if (!refresh) {
    throw new Error("No refresh token");
  }

  const resp = await fetch(API_REFRESH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  const payload = await resp.json().catch(() => ({}));

  if (!resp.ok || !payload?.access) {
    throw payload?.detail ? new Error(payload.detail) : new Error("Refresh failed");
  }

  setToken(payload.access, "access");
  return payload.access as string;
}

export async function apiFetch(input: RequestInfo, init: RequestInit = {}) {
  const access = getToken("access");

  const doFetch = (token?: string) => {
    const headers = new Headers(init.headers || {});
    headers.set("Content-Type", headers.get("Content-Type") || "application/json");

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return fetch(input, { ...init, headers });
  };

  // 1) первая попытка
  let resp = await doFetch(access || undefined);

  // 2) если токен протух — пробуем refresh и повторяем запрос
  if (resp.status === 401) {
    try {
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = refreshAccessToken().finally(() => {
          isRefreshing = false;
          refreshPromise = null;
        });
      }

      const newAccess = await refreshPromise!;
      resp = await doFetch(newAccess);
    } catch (e) {
      clearTokens();
      window.location.href = "/auth";
      throw e;
    }
  }

  // 3) parse body
  const contentType = resp.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await resp.json().catch(() => null)
    : await resp.text().catch(() => null);

  if (!resp.ok) {
    // DRF обычно отдаёт {detail: "..."}
    const message =
      (data && typeof data === "object" && "detail" in data && (data as any).detail) ||
      "Ошибка запроса";
    throw new Error(message);
  }

  return data;
}