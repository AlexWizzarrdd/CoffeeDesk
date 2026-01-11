import { apiFetch } from "@/api/apiFetch";

export type TaskType = "attestation" | "training" | "medical" | "other";
export type TaskStatus = "open" | "done" | "cancelled";

export type TaskItem = {
  id: number;
  assignee: number;
  created_by: number | null;

  title: string;
  description: string;

  type: TaskType;
  due_date: string | null;

  status: TaskStatus;
  created_at: string;
  completed_at: string | null;
};

export type CreateTaskPayload = {
  assignee: number;
  title: string;
  description?: string;
  type?: TaskType;
  due_date?: string | null; // YYYY-MM-DD
};

export const getTasks = (params?: {
  limit?: number;
  offset?: number;
  status?: TaskStatus;
  assignee_id?: number; // manager/admin only
}) => {
  const q = new URLSearchParams();
  if (params?.limit != null) q.set("limit", String(params.limit));
  if (params?.offset != null) q.set("offset", String(params.offset));
  if (params?.status) q.set("status", params.status);
  if (params?.assignee_id != null) q.set("assignee_id", String(params.assignee_id));

  const qs = q.toString();
  return apiFetch(`/api/tasks/${qs ? `?${qs}` : ""}`, { method: "GET" });
};

/**
 * ✅ Возвращает число открытых задач (для бейджа).
 * Бекенд отдаёт { count: number }
 */
export const getOpenTasksCount = async (): Promise<number> => {
  const data = await apiFetch("/api/tasks/unread-count/", { method: "GET" });
  return Number((data as any)?.count ?? 0);
};

export const markTaskDone = (id: number) => {
  return apiFetch(`/api/tasks/${id}/done/`, { method: "POST" });
};

export const createTask = (payload: CreateTaskPayload) => {
  return apiFetch("/api/tasks/", {
    method: "POST",
    body: JSON.stringify({
      ...payload,
      description: payload.description ?? "",
      type: payload.type ?? "other",
      due_date: payload.due_date ?? null,
    }),
  });
};