export async function registerUser(data) {
  const response = await fetch("/api/auth/register/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function loginUser(data) {
  const response = await fetch("/api/auth/login/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function getMe(token) {
  const response = await fetch("/api/auth/me/", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
}