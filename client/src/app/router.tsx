import { createBrowserRouter, Outlet, redirect } from "react-router";
import { AuthPage } from "../pages/AuthPage/AuthPage";
import { ProfilePage } from "../pages/ProfilePage/ProfilePage";
import { CalendarPage } from "../pages/CalendarPage/CalendarPage";
import { Sidebar } from "../views/Sidebar/Sidebar";
import { getToken } from "../utils/tokenApi";

// eslint-disable-next-line react-refresh/only-export-components
export default createBrowserRouter([
    {
        path: '/',
        element: <>
            <Sidebar />
            <Outlet />
        </>,
        loader: () => {
            // проверка и обновление токенов
            const token = getToken('access')
            if (!token) {
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