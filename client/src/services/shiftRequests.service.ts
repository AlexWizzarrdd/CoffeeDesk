import { apiFetch } from "@/api/apiFetch";

export type ShiftChangeType = "swap" | "drop" | "move" | "other";
export type ShiftChangeStatus = "pending" | "approved" | "rejected" | "cancelled";

export type ShiftChangeRequest = {
  id: number;

  type: ShiftChangeType;
  status: ShiftChangeStatus;

  comment: string;
  manager_comment: string;

  created_at: string;
  decided_at: string | null;

  requester_id: number;
  requester_name: string;

  shift: number;
  shift_date: string;
  shift_start: string;
  shift_end: string;

  employee_id: number;
};

export const getShiftChangeRequests = (params?: { status?: ShiftChangeStatus }) => {
  const q = new URLSearchParams();
  if (params?.status) q.set("status", params.status);
  const qs = q.toString();
  return apiFetch(`/api/shift-requests/${qs ? `?${qs}` : ""}`, { method: "GET" });
};

export const createShiftChangeRequest = (payload: {
  shift: number;
  type: ShiftChangeType;
  comment?: string;
}) => {
  return apiFetch("/api/shift-requests/", {
    method: "POST",
    body: JSON.stringify({
      shift: payload.shift,
      type: payload.type,
      comment: payload.comment ?? "",
    }),
  });
};

export const approveShiftChangeRequest = (id: number, manager_comment?: string) => {
  return apiFetch(`/api/shift-requests/${id}/approve/`, {
    method: "POST",
    body: JSON.stringify({ manager_comment: manager_comment ?? "" }),
  });
};

export const rejectShiftChangeRequest = (id: number, manager_comment?: string) => {
  return apiFetch(`/api/shift-requests/${id}/reject/`, {
    method: "POST",
    body: JSON.stringify({ manager_comment: manager_comment ?? "" }),
  });
};

export const cancelShiftChangeRequest = (id: number) => {
  return apiFetch(`/api/shift-requests/${id}/cancel/`, { method: "POST" });
};