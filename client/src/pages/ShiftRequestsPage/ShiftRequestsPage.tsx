import "./shiftRequestsPage.css";
import { useEffect, useMemo, useState } from "react";
import { useAuthContext } from "@/hooks/authHooks";
import { ErrorPage } from "@/pages/ErrorPage/ErrorPage";
import { Button } from "@/ui-kit/Button/Button";
import {
  approveShiftChangeRequest,
  getShiftChangeRequests,
  rejectShiftChangeRequest,
  type ShiftChangeRequest,
  type ShiftChangeStatus,
} from "@/services/shiftRequests.service";

const STATUS_LABEL: Record<ShiftChangeStatus, string> = {
  pending: "Ожидает",
  approved: "Одобрено",
  rejected: "Отклонено",
  cancelled: "Отменено",
};

const TYPE_LABEL: Record<string, string> = {
  swap: "Поменяться",
  drop: "Снять смену",
  move: "Перенести/изменить",
  other: "Другое",
};

const formatDT = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}.${mm}.${yyyy} ${hh}:${mi}`;
};

export const ShiftRequestsPage = () => {
  const { user } = useAuthContext();
  const isManagerLike = user.role === "manager" || user.role === "admin";

  const [items, setItems] = useState<ShiftChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] = useState<ShiftChangeStatus>("pending");
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getShiftChangeRequests({ status: statusFilter });
      const list = Array.isArray(data) ? data : data?.results ?? [];
      setItems(list);
    } catch (e: any) {
      setError(e?.message || "Не удалось загрузить запросы");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isManagerLike) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  if (!isManagerLike) return <ErrorPage error="Нет доступа" />;
  if (loading) return <ErrorPage error="Грузим запросы..." />;
  if (error) return <ErrorPage error={error} />;

  const onApprove = async (id: number) => {
    const manager_comment = window.prompt("Комментарий менеджера (необязательно):", "") ?? "";
    try {
      setBusyId(id);
      await approveShiftChangeRequest(id, manager_comment);
      await load();
    } catch (e: any) {
      setError(e?.message || "Не удалось одобрить");
    } finally {
      setBusyId(null);
    }
  };

  const onReject = async (id: number) => {
    const manager_comment = window.prompt("Причина отказа (необязательно):", "") ?? "";
    try {
      setBusyId(id);
      await rejectShiftChangeRequest(id, manager_comment);
      await load();
    } catch (e: any) {
      setError(e?.message || "Не удалось отклонить");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="page shift-requests-page">
      <main className="wrapper">
        <div className="shift-requests-toolbar">
          <div className="shift-requests-toolbar__left">
            <h2 style={{ margin: 0 }}>Запросы по сменам</h2>
          </div>

          <div className="shift-requests-toolbar__right">
            <select
              className="shift-requests-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ShiftChangeStatus)}
            >
              <option value="pending">Ожидают</option>
              <option value="approved">Одобренные</option>
              <option value="rejected">Отклонённые</option>
              <option value="cancelled">Отменённые</option>
            </select>

            <Button className="button-sm" onClick={load} disabled={loading}>
              {loading ? "..." : "Обновить"}
            </Button>
          </div>
        </div>

        <div className="shift-requests-list-scroll">
          <ol className="shift-requests-list">
            {items.length === 0 ? (
              <div className="shift-requests-empty">Нет запросов: {STATUS_LABEL[statusFilter]}</div>
            ) : (
              items.map((r) => {
                const disabled = busyId === r.id;

                return (
                  <li key={r.id} className="shift-request-card">
                    <div className="shift-request-card__body">
                      <div className="shift-request-card__title">
                        {r.requester_name} • {TYPE_LABEL[r.type] ?? r.type}
                      </div>

                      <div className="shift-request-card__meta">
                        • смена: <b>{r.shift_date}</b> {String(r.shift_start).slice(0, 5)}–{String(r.shift_end).slice(0, 5)} • статус:{" "}
                        <b>{STATUS_LABEL[r.status]}</b>
                      </div>

                      {r.comment ? <div className="shift-request-card__desc">{r.comment}</div> : null}

                      <div className="shift-request-card__date">
                        Создано: {formatDT(r.created_at)} {r.decided_at ? ` • Решение: ${formatDT(r.decided_at)}` : ""}
                      </div>

                      {r.manager_comment ? (
                        <div className="shift-request-card__manager">
                          Комментарий менеджера: <b>{r.manager_comment}</b>
                        </div>
                      ) : null}
                    </div>

                    <div className="shift-request-card__actions">
                      {r.status === "pending" ? (
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
                          <Button className="users__button" onClick={() => onApprove(r.id)} disabled={disabled}>
                            {disabled ? "..." : "Одобрить"}
                          </Button>
                          <Button
                            className="users__button users__button--danger"
                            onClick={() => onReject(r.id)}
                            disabled={disabled}
                          >
                            {disabled ? "..." : "Отклонить"}
                          </Button>
                        </div>
                      ) : (
                        <Button className="users__button users__button--approved" disabled>
                          {STATUS_LABEL[r.status]}
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })
            )}
          </ol>
        </div>
      </main>
    </div>
  );
};