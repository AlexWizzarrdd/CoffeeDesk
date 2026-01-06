import { createBrowserRouter, Outlet, redirect } from "react-router";
import { AuthPage } from "../pages/AuthPage/AuthPage";
import { ProfilePage } from "../pages/ProfilePage/ProfilePage";
import { CalendarPage } from "../pages/CalendarPage/CalendarPage";
import { Sidebar } from "../views/Sidebar/Sidebar";
import { getToken } from "../api/tokenApi";

// eslint-disable-next-line react-refresh/only-export-components
export default createBrowserRouter([
    {
        id: 'root',
        path: '/',
        element: <>
            <Sidebar />
            <Outlet />
        </>,
        loader: () => {
            if (!getToken('access') && !getToken('refresh')) {
                throw redirect('/auth')
            }
        },
        children: [
            {
                index: true,
                Component: ProfilePage,
                loader: () => {
                    return {
                        "id": 7,
                        "email": "test@mail.com",
                        "first_name": "Иван",
                        "last_name": "Иванов",
                        "phone": "+79991234567",
                        "role": "employee",
                        "is_approved": false,
                        "is_active": false
                    }
                }
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