import { getUsers } from "@/services/user.service";
import { Button } from "@/ui-kit/Button/Button";
import type { User } from "@/view-models/user.model";
import { useEffect, useState } from "react"

export const UsersPage = () => {
    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        getUsers()
        .then(users => setUsers(users))
    }, [])

    return <div className="page users-page">
            <main className="wrapper">
                <ol className="users">
                    {users.map((user) => {
                        return <li className="users__user flex justify-between">
                            <div className="users__user-info">
                                <p className="users__user-name">{user.first_name} {user.last_name}</p>
                                <p>{user.email}</p>
                                <p>{user.phone}</p>
                            </div>
                            {user.is_approved ? <Button classess="users__button users__button--approved">Подтверждена</Button> : <Button classess="users__button">Подтвердить</Button>}
                        </li>
                    })}
                </ol>
            </main>
        </div>
}