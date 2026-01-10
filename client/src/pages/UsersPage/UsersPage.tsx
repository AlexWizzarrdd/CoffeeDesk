import { approveUser, getUsers } from "@/services/user.service";
import { Button } from "@/ui-kit/Button/Button";
import type { User } from "@/view-models/user.model";
import { useEffect, useState } from "react";
import { useAuthContext } from "@/hooks/authHooks";
import { ErrorPage } from "@/pages/ErrorPage/ErrorPage";

export const UsersPage = () => {
  const { user: currentUser } = useAuthContext();
  const isManagerLike =
    currentUser.role === "manager" || currentUser.role === "admin";

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadUsers = () => {
    setLoading(true);
    setError("");
    getUsers()
      .then((data) => setUsers(data))
      .catch(() => setError("Не удалось загрузить пользователей"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isManagerLike) loadUsers();
  }, []);

  if (!isManagerLike) {
    return <ErrorPage error="Нет доступа" />;
  }

  if (loading) return <ErrorPage error="Грузим пользователей..." />;
  if (error) return <ErrorPage error={error} />;

  const onApprove = async (id: number) => {
    try {
      await approveUser(id);
      loadUsers();
    } catch {
      setError("Не удалось подтвердить пользователя");
    }
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
              </div>

              {u.is_approved ? (
                <Button classess="users__button users__button--approved">
                  Подтверждена
                </Button>
              ) : (
                <Button classess="users__button" onClick={() => onApprove(u.id)}>
                  Подтвердить
                </Button>
              )}
            </li>
          ))}
        </ol>
      </main>
    </div>
  );
};