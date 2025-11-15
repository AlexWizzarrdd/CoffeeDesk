import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api";

const api = axios.create({
    baseURL: API_URL,
});

// Автоматическое добавление токена
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("access");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Получить список пользователей
export const getUsers = () => api.get("/manager/users/");

// Подтвердить пользователя
export const approveUser = (id) =>
    api.patch(`/manager/users/${id}/approve/`, {
        is_approved: true,
        is_active: true,
    });

export default api;