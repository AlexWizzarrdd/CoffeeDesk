import { apiFetch } from "@/api/apiFetch";

export const getUser = () => {
  return apiFetch("/api/auth/me/", { method: "GET" });
};

export const getUsers = () => {
  return apiFetch("/api/manager/users/", { method: "GET" });
};

// approve/activate — это один эндпоинт
export const updateUser = (
  userId: number,
  payload: Partial<{ is_approved: boolean; is_active: boolean }>
) => {
  return apiFetch(`/api/manager/users/${userId}/approve/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};

export const activateUser = (userId: number) => updateUser(userId, { is_active: true });

export const approveUser = (userId: number) =>
  updateUser(userId, { is_approved: true, is_active: true });

export const deleteUser = (userId: number) => {
  return apiFetch(`/api/manager/users/${userId}/`, { method: "DELETE" });
};

// ✅ НОВОЕ: смена роли отдельным эндпоинтом
export type RoleCode = "intern" | "employee" | "manager" | "admin";

export const setUserRole = (userId: number, role: RoleCode) => {
  return apiFetch(`/api/manager/users/${userId}/role/`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
};

// ---- Backward compatibility: чтобы старые импорты не сломались ----
export const makeManager = (userId: number) => setUserRole(userId, "manager");
export const makeEmployee = (userId: number) => setUserRole(userId, "employee");