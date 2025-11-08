import { useState } from "react";

export default function Login() {
  const [form, setForm] = useState({
    phone: "",
    password: "",
  });

  const [response, setResponse] = useState("");

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const res = await fetch("http://127.0.0.1:8000/api/auth/login/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    // Если логин успешный — сохраняем токен
    if (data.access) {
      localStorage.setItem("access", data.access);
      localStorage.setItem("refresh", data.refresh);
    }

    setResponse(JSON.stringify(data, null, 2));
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>Вход</h2>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", maxWidth: "300px" }}>
        <input placeholder="Телефон" name="phone" value={form.phone} onChange={handleChange} />
        <input placeholder="Пароль" type="password" name="password" value={form.password} onChange={handleChange} />

        <button type="submit" style={{ marginTop: "10px" }}>Войти</button>
      </form>

      {response && (
        <pre style={{ background: "#eee", padding: "10px", marginTop: "20px" }}>
          {response}
        </pre>
      )}
    </div>
  );
}