// client/src/pages/UsersPage/UsersPage.tsx
import {
  activateUser,
  approveUser,
  deleteUser,
  getUsers,
  setUserRole, // ✅ добавим в user.service.ts
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

export const UsersPage = () => {
  const { user: currentUser } = useAuthContext();

  const isManagerLike = currentUser.role === "manager" || currentUser.role === "admin";
  const isAdmin = currentUser.role === "admin";

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  // ✅ два набора stats: план и факт
  const [plannedStats, setPlannedStats] = useState<StatsResponse | null>(null);
  const [workedStats, setWorkedStats] = useState<StatsResponse | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const now = useMemo(() => new Date(), []);
  const fromMonth = useMemo(() => toISO(monthFirst(now)), [now]);
  const toMonth = useMemo(() => toISO(monthLast(now)), [now]);

  // факт: 1..вчера (если вчера ещё в этом месяце, иначе 0)
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
      loadUsers();
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
      loadUsers();
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
      loadUsers();
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

  const canDelete = (u: User) => {
    if (u.id === currentUser.id) return false;
    if (currentUser.role === "admin") return true;
    // ✅ manager может удалять employee и intern (как у тебя в бекенде)
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
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <select
          value={u.role}
          disabled={disabled}
          onChange={(e) => onSetRole(u.id, e.target.value as RoleCode)}
          style={{
            padding: "8px 10px",
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(255,255,255,0.06)",
            color: "inherit",
            outline: "none",
            minWidth: 160,
          }}
        >
          {ROLE_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABEL[r]}
            </option>
          ))}
        </select>
      </div>
    );
  };

  return (
    <div className="page users-page">
      <main className="wrapper">
        <div style={{ marginBottom: 12, opacity: 0.7 }}>
          План: {fromMonth} — {toMonth} / Факт: {fromMonth} — {toWorked || "—"}{" "}
          {statsLoading ? "⏳" : ""}
        </div>

        <ol className="users">
          {users.map((u) => {
            const disabled = busyId === u.id;

            const worked = workedMap.get(u.id) || { hours: 0, minutes: 0 };
            const planned = plannedMap.get(u.id) || { hours: 0, minutes: 0 };

            const workedLabel = formatHM(worked.hours, worked.minutes);
            const plannedLabel = formatHM(planned.hours, planned.minutes);

            const roleLabel =
              (ROLE_LABEL as any)[u.role] || u.role; // если вдруг прилетит неожиданный код

            return (
              <li key={u.id} className="users__user flex justify-between">
                <div className="users__user-info">
                  <p className="users__user-name">
                    {u.last_name} {u.first_name} {u.surname}
                  </p>
                  <p>{u.phone}</p>
                  <p>Роль: {roleLabel}</p>
                  <p>
                    Статус: {u.is_active ? "active" : "inactive"} /{" "}
                    {u.is_approved ? "approved" : "pending"}
                  </p>

                  <p>
                    Отработано: <b>{workedLabel}</b> из <b>{plannedLabel}</b>
                  </p>
                </div>

                <div className="flex flex-column" style={{ gap: 8 }}>
                  {renderMainAction(u)}
                  {renderRoleUI(u)}

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
      </main>
    </div>
  );
};