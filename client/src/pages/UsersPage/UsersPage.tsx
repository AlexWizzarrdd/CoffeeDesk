import {
  activateUser,
  approveUser,
  deleteUser,
  getUsers,
  makeEmployee,
  makeManager,
} from "@/services/user.service";
import { Button } from "@/ui-kit/Button/Button";
import type { User } from "@/view-models/user.model";
import { useEffect, useState } from "react";
import { useAuthContext } from "@/hooks/authHooks";
import { ErrorPage } from "@/pages/ErrorPage/ErrorPage";

export const UsersPage = () => {
  const { user: currentUser } = useAuthContext();

  const isManagerLike = currentUser.role === "manager" || currentUser.role === "admin";
  const isAdmin = currentUser.role === "admin";

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const loadUsers = () => {
    setLoading(true);
    setError("");
    getUsers()
      .then((data) => setUsers(data))
      .catch((e: any) => setError(e?.message || "Не удалось загрузить пользователей"))
      .finally(() => setLoading(false));
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

  // NEW: смена роли
  const onMakeManager = async (id: number) => {
    try {
      setBusyId(id);
      await makeManager(id);
      loadUsers();
    } catch (e: any) {
      setError(e?.message || "Не удалось назначить менеджера");
    } finally {
      setBusyId(null);
    }
  };

  const onMakeEmployee = async (id: number) => {
    try {
      setBusyId(id);
      await makeEmployee(id);
      loadUsers();
    } catch (e: any) {
      setError(e?.message || "Не удалось снять менеджера");
    } finally {
      setBusyId(null);
    }
  };

  const canDelete = (u: User) => {
    if (u.id === currentUser.id) return false;
    if (currentUser.role === "admin") return true;
    return currentUser.role === "manager" && u.role === "employee";
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

  // NEW: кнопки роли (только админ)
  const renderRoleAction = (u: User) => {
    if (!isAdmin) return null;
    if (u.id === currentUser.id) return null; // себя не трогаем

    const disabled = busyId === u.id;

    if (u.role === "employee") {
      return (
        <Button classess="users__button" onClick={() => onMakeManager(u.id)} disabled={disabled}>
          {disabled ? "..." : "Сделать менеджером"}
        </Button>
      );
    }

    if (u.role === "manager") {
      return (
        <Button classess="users__button" onClick={() => onMakeEmployee(u.id)} disabled={disabled}>
          {disabled ? "..." : "Сделать сотрудником"}
        </Button>
      );
    }

    // admin-ов не меняем (и так)
    return null;
  };

  return (
    <div className="page users-page">
      <main className="wrapper">
        <ol className="users">
          {users.map((u) => {
            const disabled = busyId === u.id;

            return (
              <li key={u.id} className="users__user flex justify-between">
                <div className="users__user-info">
                  <p className="users__user-name">
                    {u.last_name} {u.first_name} {u.surname}
                  </p>
                  <p>{u.phone}</p>
                  <p>Роль: {u.role}</p>
                  <p>
                    Статус: {u.is_active ? "active" : "inactive"} /{" "}
                    {u.is_approved ? "approved" : "pending"}
                  </p>
                </div>

                <div className="flex flex-column" style={{ gap: 8 }}>
                  {renderMainAction(u)}
                  {renderRoleAction(u)}

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