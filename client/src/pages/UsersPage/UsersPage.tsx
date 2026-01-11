// client/src/pages/UsersPage/UsersPage.tsx
import "./usersPage.css";
import {
  activateUser,
  approveUser,
  deleteUser,
  getUsers,
  setUserRole,
  setUserMedicalExam,
} from "@/services/user.service";
import { Button } from "@/ui-kit/Button/Button";
import type { User } from "@/view-models/user.model";
import { useEffect, useMemo, useState } from "react";
import { useAuthContext } from "@/hooks/authHooks";
import { ErrorPage } from "@/pages/ErrorPage/ErrorPage";
import { getStats, type StatsResponse } from "@/services/schedule.service";

const toISO = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const monthFirst = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const monthLast = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
const yesterday = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1);

const formatHM = (hours: number, minutes: number) => `${hours}ч ${minutes}м`;
type HM = { hours: number; minutes: number };

const buildHMMap = (stats: StatsResponse | null) => {
  const m = new Map<number, HM>();
  for (const item of stats?.items || []) {
    m.set(item.employee_id, { hours: item.hours, minutes: item.minutes });
  }
  return m;
};

type RoleCode = "employee" | "intern" | "manager" | "admin";

const ROLE_LABEL: Record<RoleCode, string> = {
  employee: "Бариста",
  intern: "Стажёр",
  manager: "Менеджер",
  admin: "Управляющий",
};

const ROLE_OPTIONS: RoleCode[] = ["employee", "intern", "manager", "admin"];

const toDateInputValue = (iso?: string | null) => (iso ? iso.slice(0, 10) : "");

const formatRuDate = (iso?: string | null) => {
  if (!iso) return "не указано";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
};

export const UsersPage = () => {
  const { user: currentUser } = useAuthContext();

  const isManagerLike = currentUser.role === "manager" || currentUser.role === "admin";
  const isAdmin = currentUser.role === "admin";

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const [plannedStats, setPlannedStats] = useState<StatsResponse | null>(null);
  const [workedStats, setWorkedStats] = useState<StatsResponse | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const now = useMemo(() => new Date(), []);
  const fromMonth = useMemo(() => toISO(monthFirst(now)), [now]);
  const toMonth = useMemo(() => toISO(monthLast(now)), [now]);

  const toWorked = useMemo(() => {
    const y = yesterday(now);
    if (y < monthFirst(now)) return null;
    return toISO(y);
  }, [now]);

  const plannedMap = useMemo(() => buildHMMap(plannedStats), [plannedStats]);
  const workedMap = useMemo(() => buildHMMap(workedStats), [workedStats]);

  const loadUsers = async () => {
    setLoading(true);
    setError("");
    setStatsLoading(true);

    try {
      const data = await getUsers();
      setUsers(data);

      const planned = await getStats(fromMonth, toMonth);
      setPlannedStats(planned);

      if (toWorked) {
        const worked = await getStats(fromMonth, toWorked);
        setWorkedStats(worked);
      } else {
        setWorkedStats({
          from: fromMonth,
          to: fromMonth,
          count_users: 0,
          items: [],
        });
      }
    } catch (e: any) {
      setError(e?.message || "Не удалось загрузить пользователей");
    } finally {
      setLoading(false);
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    if (isManagerLike) loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isManagerLike) return <ErrorPage error="Нет доступа" />;
  if (loading) return <ErrorPage error="Грузим пользователей..." />;
  if (error) return <ErrorPage error={error} />;

  const onActivate = async (id: number) => {
    try {
      setBusyId(id);
      await activateUser(id);
      await loadUsers();
    } catch (e: any) {
      setError(e?.message || "Не удалось активировать пользователя");
    } finally {
      setBusyId(null);
    }
  };

  const onApprove = async (id: number) => {
    try {
      setBusyId(id);
      await approveUser(id);
      await loadUsers();
    } catch (e: any) {
      setError(e?.message || "Не удалось подтвердить пользователя");
    } finally {
      setBusyId(null);
    }
  };

  const onDelete = async (id: number) => {
    if (id === currentUser.id) {
      setError("Нельзя удалить самого себя");
      return;
    }

    const ok = window.confirm("Удалить пользователя? Это действие необратимо.");
    if (!ok) return;

    try {
      setBusyId(id);
      await deleteUser(id);
      await loadUsers();
    } catch (e: any) {
      setError(e?.message || "Не удалось удалить пользователя");
    } finally {
      setBusyId(null);
    }
  };

  const onSetRole = async (id: number, role: RoleCode) => {
    try {
      setBusyId(id);
      await setUserRole(id, role);
      await loadUsers();
    } catch (e: any) {
      setError(e?.message || "Не удалось изменить роль");
    } finally {
      setBusyId(null);
    }
  };

  const onSetMedicalExam = async (id: number, date: string | null) => {
    try {
      setBusyId(id);
      await setUserMedicalExam(id, date);
      await loadUsers();
    } catch (e: any) {
      setError(e?.message || "Не удалось обновить дату медосмотра");
    } finally {
      setBusyId(null);
    }
  };

  const canDelete = (u: User) => {
    if (u.id === currentUser.id) return false;
    if (currentUser.role === "admin") return true;
    return currentUser.role === "manager" && (u.role === "employee" || u.role === "intern");
  };

  const renderMainAction = (u: User) => {
    const disabled = busyId === u.id;

    if (!u.is_active) {
      return (
        <Button classess="users__button" onClick={() => onActivate(u.id)} disabled={disabled}>
          {disabled ? "..." : "Активировать"}
        </Button>
      );
    }

    if (u.is_active && !u.is_approved) {
      return (
        <Button classess="users__button" onClick={() => onApprove(u.id)} disabled={disabled}>
          {disabled ? "..." : "Подтвердить"}
        </Button>
      );
    }

    return (
      <Button classess="users__button users__button--approved" disabled>
        Активен
      </Button>
    );
  };

  const renderRoleUI = (u: User) => {
    if (!isAdmin) return null;
    if (u.id === currentUser.id) return null;

    const disabled = busyId === u.id;

    return (
      <select
        className="users-control"
        value={u.role}
        disabled={disabled}
        onChange={(e) => onSetRole(u.id, e.target.value as RoleCode)}
      >
        {ROLE_OPTIONS.map((r) => (
          <option key={r} value={r}>
            {ROLE_LABEL[r]}
          </option>
        ))}
      </select>
    );
  };

  const renderMedicalExamUI = (u: User) => {
    const disabled = busyId === u.id;
    return (
      <input
        className="users-control"
        type="date"
        value={toDateInputValue((u as any).medical_exam_recommended_at)}
        disabled={disabled}
        onChange={(e) => onSetMedicalExam(u.id, e.target.value ? e.target.value : null)}
      />
    );
  };

  return (
    <div className="page users-page">
      <main className="wrapper">
        <div className="users-hint">
          План: {fromMonth} — {toMonth} / Факт: {fromMonth} — {toWorked || "—"}{" "}
          {statsLoading ? "⏳" : ""}
        </div>

        {/* ✅ скролл только здесь */}
        <div className="users-list-scroll">
          <ol className="users">
            {users.map((u) => {
              const disabled = busyId === u.id;

              const worked = workedMap.get(u.id) || { hours: 0, minutes: 0 };
              const planned = plannedMap.get(u.id) || { hours: 0, minutes: 0 };

              const workedLabel = formatHM(worked.hours, worked.minutes);
              const plannedLabel = formatHM(planned.hours, planned.minutes);

              const roleLabel = (ROLE_LABEL as any)[u.role] || u.role;
              const medicalRu = formatRuDate((u as any).medical_exam_recommended_at);

              return (
                <li key={u.id} className="users__user">
                  <div className="users__user-info">
                    <p className="users__user-name">
                      {u.last_name} {u.first_name} {u.surname}
                    </p>

                    <p className="users__row users__muted">{u.phone}</p>
                    <p className="users__row">Роль: <b>{roleLabel}</b></p>
                    <p className="users__row users__muted">
                      Статус: {u.is_active ? "active" : "inactive"} /{" "}
                      {u.is_approved ? "approved" : "pending"}
                    </p>

                    <p className="users__row">
                      Медосмотр (рекомендуется до): <b>{medicalRu}</b>
                    </p>

                    <p className="users__row">
                      Отработано: <b>{workedLabel}</b> из <b>{plannedLabel}</b>
                    </p>
                  </div>

                  <div className="users__actions">
                    {renderMainAction(u)}
                    {renderRoleUI(u)}
                    {renderMedicalExamUI(u)}

                    {canDelete(u) ? (
                      <Button
                        classess="users__button users__button--danger"
                        onClick={() => onDelete(u.id)}
                        disabled={disabled}
                      >
                        {disabled ? "..." : "Удалить"}
                      </Button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </main>
    </div>
  );
};