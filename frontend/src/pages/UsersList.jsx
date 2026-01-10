import { useEffect, useState } from "react";
import api from "../api/users";

export default function UsersList() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const access = localStorage.getItem("access");
    const response = await api.getUsers(access);
    setUsers(response.data);
  };

  return (
    <div>
      <h2>Пользователи</h2>

      <table border="1" cellPadding="6">
        <thead>
          <tr>
            <th>ID</th>
            <th>ФИО</th>
            <th>Телефон</th>
            <th>Роль</th>
            <th>Статус</th>
          </tr>
        </thead>

        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.first_name} {u.last_name}</td>
              <td>{u.phone}</td>
              <td>{u.role}</td>
              <td>{u.is_approved ? "Подтверждён" : "Ожидает"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}