import { apiFetch } from "@/api/apiFetch";

export const getUser = () => {
  return apiFetch("/api/auth/me/", { method: "GET" });
};

export const getUsers = () => {
  return apiFetch("/api/manager/users/", { method: "GET" });
};

export const updateUser = (
  userId: number,
  payload: Partial<{ is_approved: boolean; is_active: boolean; role: string }>
) => {
  return apiFetch(`/api/manager/users/${userId}/approve/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};

export const activateUser = (userId: number) =>
  updateUser(userId, { is_active: true });

export const approveUser = (userId: number) =>
  updateUser(userId, { is_approved: true, is_active: true });

export const deleteUser = (userId: number) => {
  return apiFetch(`/api/manager/users/${userId}/`, { method: "DELETE" });
};

// ---- NEW: смена роли (только админ будет видеть кнопки) ----
export const setRole = (userId: number, role: "employee" | "manager") =>
  updateUser(userId, { role });

export const makeManager = (userId: number) => setRole(userId, "manager");
export const makeEmployee = (userId: number) => setRole(userId, "employee");