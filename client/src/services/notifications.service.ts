// client/src/services/notifications.service.ts
import { apiFetch } from "@/api/apiFetch";

export type NotificationType =
  | "shift_created"
  | "shift_updated"
  | "shift_deleted"
  | "shift_reassigned";

export type NotificationItem = {
  id: number;
  type: NotificationType;
  title: string;
  message?: string;
  data: Record<string, any>;
  is_read: boolean;
  created_at: string;
};

export type NotificationsListResponse =
  | { results: NotificationItem[]; count?: number; next?: string | null; previous?: string | null }
  | NotificationItem[];

// Если бек отдаёт просто массив — тоже поддерживаем
const normalizeList = (resp: NotificationsListResponse): NotificationItem[] => {
  if (Array.isArray(resp)) return resp;
  if (resp && Array.isArray((resp as any).results)) return (resp as any).results;
  return [];
};

export const getNotifications = async (params?: {
  unread?: boolean;
  limit?: number;
  offset?: number;
}): Promise<NotificationItem[]> => {
  const qs = new URLSearchParams();
  if (params?.unread) qs.set("unread", "1");
  if (typeof params?.limit === "number") qs.set("limit", String(params.limit));
  if (typeof params?.offset === "number") qs.set("offset", String(params.offset));

  const url = qs.toString()
    ? `/api/notifications/?${qs.toString()}`
    : `/api/notifications/`;

  const resp = await apiFetch(url, { method: "GET" });
  return normalizeList(resp);
};

export const getUnreadCount = async (): Promise<number> => {
  const resp = await apiFetch("/api/notifications/unread-count/", { method: "GET" });

  // ожидаем {count: number} но подстрахуемся
  if (typeof resp === "number") return resp;
  if (resp && typeof resp.count === "number") return resp.count;
  return 0;
};

export const markNotificationRead = async (id: number) => {
  return apiFetch(`/api/notifications/${id}/read/`, { method: "POST" });
};

export const markAllRead = async () => {
  return apiFetch("/api/notifications/read-all/", { method: "POST" });
};