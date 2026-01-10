import { createBrowserRouter, Outlet, redirect } from "react-router";
import { AuthProvider } from "@/app/providers/AuthProvider";
import { AuthPage } from "../pages/AuthPage/AuthPage";
import { ProfilePage } from "../pages/ProfilePage/ProfilePage";
import { CalendarPage } from "../pages/CalendarPage/CalendarPage";
import { Sidebar } from "../views/Sidebar/Sidebar";
import { getToken } from "../api/tokenApi";
import { UsersPage } from "@/pages/UsersPage/UsersPage";

// eslint-disable-next-line react-refresh/only-export-components
export default createBrowserRouter([
    {
        id: 'root',
        path: '/',
        element: <AuthProvider>
            <div className="background-1">
                <Sidebar />
                <Outlet />
            </div>
        </AuthProvider>,
        loader: () => {
            if (!getToken('access') && !getToken('refresh')) {
                throw redirect('/auth')
            }
        },
        children: [
            {
                index: true,
                Component: ProfilePage
            },
            {
                path: 'calendar',
                Component: CalendarPage
            },
            {
                path: 'users',
                Component: UsersPage
            }
        ]
    },
    {
        path: '/auth',
        element: <AuthPage />,
        loader: () => {
            if (getToken('access')) {
                throw redirect('/')
            }
        }
    }
])