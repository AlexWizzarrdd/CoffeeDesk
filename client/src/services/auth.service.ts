import { setTokens, clearTokens, getToken } from "@/api/tokenApi";

type LoginData = {
  phone: string;
  password: string;
};

type SignupData = {
  password: string;
  first_name: string;
  last_name: string;
  surname: string;
  phone: string;
};

export async function logIn(data: LoginData) {
  const resp = await fetch("/api/auth/login/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const payload = await resp.json().catch(() => ({}));

  if (!resp.ok) {
    throw new Error(payload?.detail || "Неверный телефон или пароль");
  }

  if (!payload?.access || !payload?.refresh) {
    throw new Error("Сервер не вернул токены");
  }

  setTokens(payload.access, payload.refresh);
  return payload;
}

export async function signUp(data: SignupData) {
  const resp = await fetch("/api/auth/register/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const payload = await resp.json().catch(() => ({}));

  if (!resp.ok) {
    // DRF обычно отдаёт ошибки полей объектом
    throw payload;
  }

  return payload;
}

export async function logout() {
  const refresh = getToken("refresh");

  // если у тебя на бэке есть /api/auth/logout/
  if (refresh) {
    await fetch("/api/auth/logout/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    }).catch(() => {});
  }

  clearTokens();
}