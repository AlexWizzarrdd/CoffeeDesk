import { apiFetch } from "@/api/apiFetch";

export const getUser = () => {
  return apiFetch("/api/auth/me/", { method: "GET" });
};

export const getUsers = () => {
  return apiFetch("/api/manager/users/", { method: "GET" });
};

// универсально обновить флаги/роль
export const updateUser = (
  userId: number,
  payload: Partial<{ is_approved: boolean; is_active: boolean; role: string }>
) => {
  return apiFetch(`/api/manager/users/${userId}/approve/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};

// удобные “шорткаты”
export const activateUser = (userId: number) => updateUser(userId, { is_active: true });

export const approveUser = (userId: number) =>
  updateUser(userId, { is_approved: true, is_active: true });