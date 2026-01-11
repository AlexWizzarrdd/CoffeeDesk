// client/src/services/user.service.ts
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

// ✅ смена роли отдельным эндпоинтом
export type RoleCode = "intern" | "employee" | "manager" | "admin";

export const setUserRole = (userId: number, role: RoleCode) => {
  return apiFetch(`/api/manager/users/${userId}/role/`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
};

// ✅ НОВОЕ: дата рекомендуемого медосмотра (мед-книжка)
// date: "YYYY-MM-DD" или null (сбросить)
export const setUserMedicalExam = (userId: number, medical_exam_recommended_at: string | null) => {
  return apiFetch(`/api/manager/users/${userId}/medical-exam/`, {
    method: "PATCH",
    body: JSON.stringify({ medical_exam_recommended_at }),
  });
};

// ---- Backward compatibility: чтобы старые импорты не сломались ----
export const makeManager = (userId: number) => setUserRole(userId, "manager");
export const makeEmployee = (userId: number) => setUserRole(userId, "employee");