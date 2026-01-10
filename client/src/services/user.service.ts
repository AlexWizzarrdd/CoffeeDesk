import { apiFetch } from "@/api/apiFetch";

export const getUser = () => {
  return apiFetch("/api/auth/me/", { method: "GET" });
};

export const getUsers = () => {
  return apiFetch("/api/manager/users/", { method: "GET" });
};

export const approveUser = (userId: number) => {
  return apiFetch(`/api/manager/users/${userId}/approve/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_approved: true, is_active: true }),
  });
};