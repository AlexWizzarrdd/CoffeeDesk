import { activateUser, approveUser, getUsers } from "@/services/user.service";
import { Button } from "@/ui-kit/Button/Button";
import type { User } from "@/view-models/user.model";
import { useEffect, useState } from "react";
import { useAuthContext } from "@/hooks/authHooks";
import { ErrorPage } from "@/pages/ErrorPage/ErrorPage";

export const UsersPage = () => {
  const { user: currentUser } = useAuthContext();
  const isManagerLike = currentUser.role === "manager" || currentUser.role === "admin";

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getUsers();
      setUsers(data);
    } catch {
      setError("Не удалось загрузить пользователей");
    } finally {
      setLoading(false);
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
    } catch {
      setError("Не удалось активировать пользователя");
    } finally {
      setBusyId(null);
    }
  };

  const onApprove = async (id: number) => {
    try {
      setBusyId(id);
      await approveUser(id);
      await loadUsers();
    } catch {
      setError("Не удалось подтвердить пользователя");
    } finally {
      setBusyId(null);
    }
  };

  const renderAction = (u: User) => {
    const isBusy = busyId === u.id;
    const isSelf = currentUser.id === u.id;

    // себя не трогаем (чтобы случайно не деактивировать/не ломать)
    if (isSelf) {
      return (
        <Button classess="users__button users__button--approved" type="button" disabled>
          Это вы ✅
        </Button>
      );
    }

    // 1) Неактивен -> активируем
    if (!u.is_active) {
      return (
        <Button
          classess="users__button"
          type="button"
          disabled={isBusy}
          onClick={() => onActivate(u.id)}
        >
          {isBusy ? "..." : "Активировать"}
        </Button>
      );
    }

    // 2) Активен, но не подтвержден -> подтверждаем
    if (u.is_active && !u.is_approved) {
      return (
        <Button
          classess="users__button"
          type="button"
          disabled={isBusy}
          onClick={() => onApprove(u.id)}
        >
          {isBusy ? "..." : "Подтвердить"}
        </Button>
      );
    }

    // 3) Всё ок
    return (
      <Button classess="users__button users__button--approved" type="button" disabled>
        Активен ✅
      </Button>
    );
  };

  return (
    <div className="page users-page">
      <main className="wrapper">
        <ol className="users">
          {users.map((u) => (
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

              {renderAction(u)}
            </li>
          ))}
        </ol>
      </main>
    </div>
  );
};