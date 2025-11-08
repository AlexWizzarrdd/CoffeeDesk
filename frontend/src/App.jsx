import { useState } from "react";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Profile from "./pages/Profile";

function App() {
  const [page, setPage] = useState("register");

  return (
    <div>
      <div style={{ display: "flex", gap: "20px", padding: "10px" }}>
        <button onClick={() => setPage("register")}>Регистрация</button>
        <button onClick={() => setPage("login")}>Вход</button>
        <button onClick={() => setPage("profile")}>Личный кабинет</button>
      </div>

      {page === "register" && <Register />}
      {page === "login" && <Login />}
      {page === "profile" && <Profile />}
    </div>
  );
}

export default App;