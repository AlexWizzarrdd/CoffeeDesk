import { apiFetch } from "@/api/apiFetch";

// То, что реально возвращает ShiftListSerializer
export type Shift = {
  id: number;

  employee_id: number;
  employee_name: string;
  employee_phone?: string;

  date: string; // "YYYY-MM-DD"
  start_time: string; // "HH:MM:SS"
  end_time: string; // "HH:MM:SS"
  comment?: string;
  created_at?: string;
};

// Для create/update (ShiftCreateSerializer ожидает employee, а не employee_id)
export type ShiftPayload = {
  employee: number;
  date: string;
  start_time: string; // "HH:MM"
  end_time: string; // "HH:MM"
  comment?: string;
};

export const getShifts = (from: string, to: string): Promise<Shift[]> => {
  const qs = new URLSearchParams({ from, to });
  return apiFetch(`/api/schedule/shifts/?${qs.toString()}`, { method: "GET" });
};

// alias (если где-то в коде импортируешь listShifts)
export const listShifts = getShifts;

export const createShift = (payload: ShiftPayload) => {
  return apiFetch("/api/schedule/shifts/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const updateShift = (id: number, payload: Partial<ShiftPayload>) => {
  return apiFetch(`/api/schedule/shifts/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};

export const deleteShift = (id: number) => {
  return apiFetch(`/api/schedule/shifts/${id}/`, { method: "DELETE" });
};

export type RoleCode = "employee" | "intern" | "manager" | "admin";

export const generateMonthShifts = (payload: {
  month: string; // "YYYY-MM"
  per_day: number;
  start_time: string; // "HH:MM"
  end_time: string; // "HH:MM"
  overwrite?: boolean;
  include_roles?: RoleCode[];
  comment?: string;
}) => {
  return apiFetch("/api/schedule/shifts/generate-month/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

// -------------------- ✅ STATS --------------------

export type StatsItem = {
  employee_id: number;
  employee_name: string;
  shifts_count: number;
  total_seconds: number;
  hours: number;
  minutes: number;
};

export type StatsResponse = {
  from: string;
  to: string;
  count_users: number;
  items: StatsItem[];
};

export const getStats = (
  from: string,
  to: string,
  employeeId?: number
): Promise<StatsResponse> => {
  const qs = new URLSearchParams({
    from_date: from,
    to_date: to,
  });

  if (employeeId) qs.set("employee_id", String(employeeId));

  return apiFetch(`/api/schedule/stats/?${qs.toString()}`, { method: "GET" });
};