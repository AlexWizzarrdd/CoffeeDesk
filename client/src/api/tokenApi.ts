export const getToken = (type: string) => {
    const token = localStorage.getItem(type);
    return token;
}

export const setToken = (token: string, type: string) => {
    localStorage.setItem(type, token);
}

export const clearTokens = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
}