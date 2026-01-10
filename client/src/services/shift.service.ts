import { apiFetch } from "@/api/apiFetch";

export type Shift = {
  id: number;
  user: number;
  user_name?: string;
  start_at: string; // ISO
  end_at: string;   // ISO
  comment?: string | null;
  created_by?: number;
};

export type CreateShiftPayload = {
  user: number;
  start_at: string;
  end_at: string;
  comment?: string;
};

export const getShifts = (fromISO: string, toISO: string, userId?: number) => {
  const params = new URLSearchParams({ from: fromISO, to: toISO });
  if (userId) params.set("user_id", String(userId));

  return apiFetch(`/api/schedule/shifts/?${params.toString()}`, { method: "GET" }) as Promise<Shift[]>;
};

export const createShift = (payload: CreateShiftPayload) => {
  return apiFetch(`/api/schedule/shifts/`, {
    method: "POST",
    body: JSON.stringify(payload),
  }) as Promise<Shift>;
};

export const deleteShift = (id: number) => {
  return apiFetch(`/api/schedule/shifts/${id}/`, { method: "DELETE" });
};

export const updateShift = (id: number, payload: Partial<CreateShiftPayload>) => {
  return apiFetch(`/api/schedule/shifts/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  }) as Promise<Shift>;
};