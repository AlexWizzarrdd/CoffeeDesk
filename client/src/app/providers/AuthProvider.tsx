import { ErrorPage } from "@/pages/ErrorPage/ErrorPage";
import { getUser } from "@/services/user.service";
import type { User } from "@/view-models/user.model";
import { useEffect, useState, type ReactNode } from "react";
import { AuthContext } from "../../contexts/AuthContext";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User|null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        setIsLoading(true);
        getUser()
        .then((user) => setUser(user))
        .catch((error) => setError(error.message))
        .finally(() => setIsLoading(false))
    }, [])

    if (isLoading) {
        return <ErrorPage error={'Грузим данные...'} />
    }

    if (!user || error) {
        return <ErrorPage error={error} />
    }

    if (!user.is_active) {
        return <ErrorPage error={'Пользователь неактивен'} />
    }

    if (!user.is_approved) {
        return <ErrorPage error={'Пользователь пока не подтвержден'} />
    }

    return <AuthContext.Provider value={ { user } }>
        {children}
    </AuthContext.Provider>
}