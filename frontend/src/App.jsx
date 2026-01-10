import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Profile from "./pages/Profile.jsx";
import UsersList from "./pages/UsersList.jsx";
import PrivateRoute from "./components/PrivateRoute.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Личный кабинет */}
      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <Profile />
          </PrivateRoute>
        }
      />

      {/* Страница менеджера */}
      <Route
        path="/manager/users"
        element={
          <PrivateRoute managerOnly={true}>
            <UsersList />
          </PrivateRoute>
        }
      />

      {/* Редирект всего неизвестного на login */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}