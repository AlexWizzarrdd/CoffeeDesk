import { Navigate } from "react-router-dom";

export default function PrivateRoute({ children, managerOnly = false }) {
  const access = localStorage.getItem("access");
  const role = localStorage.getItem("role"); // сохраняем при логине

  if (!access) {
    return <Navigate to="/login" />;
  }

  if (managerOnly && role !== "manager" && role !== "admin") {
    return <Navigate to="/me" />;
  }

  return children;
}