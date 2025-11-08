import { useEffect, useState } from "react";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem("access");

      if (!token) {
        setError("Нет токена. Авторизуйтесь.");
        return;
      }

      const res = await fetch("http://127.0.0.1:8000/api/auth/me/", {
        headers: {
          Authorization: "Bearer " + token,
        },
      });

      if (res.status === 401) {
        setError("Токен недействителен. Зайдите заново.");
        return;
      }

      const data = await res.json();
      setUser(data);
    }

    loadUser();
  }, []);

  if (error) {
    return <div style={{ padding: 20, color: "red" }}>{error}</div>;
  }

  if (!user) {
    return <div style={{ padding: 20 }}>Загрузка...</div>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Личный кабинет</h2>

      <div style={{ marginTop: 10 }}>
        <p><strong>ID:</strong> {user.id}</p>
        <p><strong>Имя:</strong> {user.first_name}</p>
        <p><strong>Фамилия:</strong> {user.last_name}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Телефон:</strong> {user.phone}</p>
        <p><strong>Менеджер/Сотрудник (is_staff):</strong> {String(user.is_staff)}</p>
      </div>
    </div>
  );
}