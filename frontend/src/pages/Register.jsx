import { useState } from "react";

export default function Register() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    phone: "",
  });

  const [response, setResponse] = useState("");

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const res = await fetch("http://127.0.0.1:8000/api/auth/register/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setResponse(JSON.stringify(data, null, 2));
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>Регистрация</h2>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", maxWidth: "300px" }}>
        <input placeholder="Email" name="email" value={form.email} onChange={handleChange} />
        <input placeholder="Телефон" name="phone" value={form.phone} onChange={handleChange} />
        <input placeholder="Имя" name="first_name" value={form.first_name} onChange={handleChange} />
        <input placeholder="Фамилия" name="last_name" value={form.last_name} onChange={handleChange} />
        <input placeholder="Пароль" type="password" name="password" value={form.password} onChange={handleChange} />

        <button type="submit" style={{ marginTop: "10px" }}>Зарегистрироваться</button>
      </form>

      {response && (
        <pre style={{ background: "#eee", padding: "10px", marginTop: "20px" }}>
          {response}
        </pre>
      )}
    </div>
  );
}