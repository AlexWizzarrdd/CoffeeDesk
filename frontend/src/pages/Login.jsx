import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/auth";

export default function Login() {
  const navigate = useNavigate();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await api.post("/auth/login/", {
        phone,
        password,
      });

      // сохраняем токены
      localStorage.setItem("access", response.data.access);
      localStorage.setItem("refresh", response.data.refresh);

      navigate("/profile"); // <--- ВАЖНО
    } catch (err) {
      setError("Неверный телефон или пароль");
    }
  };

  return (
    <div>
      <h2>Вход</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleLogin}>
        <input
          type="text"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Телефон"
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Пароль"
        />

        <button type="submit">Войти</button>
      </form>
    </div>
  );
}