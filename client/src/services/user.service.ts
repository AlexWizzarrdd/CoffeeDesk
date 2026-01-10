import { apiFetch } from "@/api/apiFetch";

export const getUser = () => {
    return apiFetch('/api/auth/me/', {
        method: "GET"
    })
}

export const getUsers = () => {
    return apiFetch('/api/manager/users/', {
        method: 'GET'
    })
}