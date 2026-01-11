// router.tsx
import { createBrowserRouter, Outlet, redirect } from "react-router";
import { AuthProvider } from "@/app/providers/AuthProvider";
import { AuthPage } from "@/pages/AuthPage/AuthPage";
import { ProfilePage } from "@/pages/ProfilePage/ProfilePage";
import { CalendarPage } from "@/pages/CalendarPage/CalendarPage";
import { UsersPage } from "@/pages/UsersPage/UsersPage";
import { NotificationsPage } from "@/pages/NotificationsPage/NotificationsPage";
import { Sidebar } from "@/views/Sidebar/Sidebar";
import { getToken } from "@/api/tokenApi";
import { TasksPage } from "@/pages/TasksPage/TasksPage";

export default createBrowserRouter([
  {
    id: "root",
    path: "/",
    element: (
      <AuthProvider>
        <div className="background-1">
          <Sidebar />
          <Outlet />
        </div>
      </AuthProvider>
    ),
    loader: () => {
      if (!getToken("access") && !getToken("refresh")) throw redirect("/auth");
      return null;
    },
    children: [
      { index: true, Component: ProfilePage },
      { path: "calendar", Component: CalendarPage },
      { path: "users", Component: UsersPage },
      { path: "notifications", Component: NotificationsPage },

      // ✅ добавили страницу задач
      { path: "tasks", Component: TasksPage },
    ],
  },
  { path: "/auth", element: <AuthPage /> },
]);