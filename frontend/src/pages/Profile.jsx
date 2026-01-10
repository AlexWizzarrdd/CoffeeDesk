import { useEffect, useState } from "react";
import { getUsers, approveUser } from "../api/users";

export default function Profile() {
  const [users, setUsers] = useState([]);

  // загрузка списка пользователей
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await getUsers();
      setUsers(response.data);
    } catch (err) {
      console.error("Ошибка загрузки списка:", err);
    }
  };

  // подтверждение пользователя
  const handleApprove = async (id) => {
    try {
      await approveUser(id);
      loadUsers(); // обновляем таблицу
    } catch (err) {
      console.error("Ошибка подтверждения:", err);
    }
  };

  return (
    <div>
      <h2>Пользователи</h2>

      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>ID</th>
            <th>ФИО</th>
            <th>Телефон</th>
            <th>Роль</th>
            <th>Статус</th>
            <th>Действие</th>
          </tr>
        </thead>

        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.id}</td>

              {/* ФИО */}
              <td>
                {(u.first_name ?? "") + " " + (u.last_name ?? "")}
              </td>

              <td>{u.phone}</td>
              <td>{u.role}</td>

              {/* статус */}
              <td style={{ color: u.is_approved ? "lightgreen" : "orange" }}>
                {u.is_approved ? "Подтверждён" : "Ожидает"}
              </td>

              {/* кнопка утверждения */}
              <td>
                {!u.is_approved && (
                  <button onClick={() => handleApprove(u.id)}>
                    Подтвердить
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}