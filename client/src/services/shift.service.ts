import { apiFetch } from "@/api/apiFetch";

export type Shift = {
  id: number;
  employee_id: number;        // ✅ приходит с бэка
  employee_name: string;
  employee_phone?: string;

  date: string;
  start_time: string;
  end_time: string;
  comment?: string;
};

export const getShifts = (from: string, to: string): Promise<Shift[]> => {
  return apiFetch(`/api/schedule/shifts/?from=${from}&to=${to}`, { method: "GET" });
};

export const createShift = (payload: {
  employee: number;
  date: string;
  start_time: string;
  end_time: string;
  comment?: string;
}) => {
  return apiFetch("/api/schedule/shifts/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const updateShift = (
  id: number,
  payload: Partial<{ employee: number; date: string; start_time: string; end_time: string; comment: string }>
) => {
  return apiFetch(`/api/schedule/shifts/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};

export const deleteShift = (id: number) => {
  return apiFetch(`/api/schedule/shifts/${id}/`, { method: "DELETE" });
};