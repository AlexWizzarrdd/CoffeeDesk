import { clearTokens, getToken, setToken } from "./tokenApi";

const fetchWithPause = (url: string, time: number, tryCount: number) => {
    return fetch('/api/auth/me/')
    .catch(error => {
        if (tryCount > 0) {
            setTimeout(() => fetchWithPause(url, time * 2, tryCount - 1), time)
        }
        else {
            throw Error('Error!');
        }
    })
}

export const apiFetch = (input: RequestInfo, init: RequestInit) => {
    const res = fetch(input, {
        ...init,
        headers: {
            ...init.headers,
            Authorization: `Bearer: ${getToken('access')}`
        }
    })

    return res.then(resp => {
        if (resp.status === 401) {
            fetch('/api/auth/token/refresh/')
            .then(resp => {
                if (resp.ok) {
                    resp.json().then(token => setToken('access', token));
                    return apiFetch(input, init);
                }
                else {
                    window.location.href = '/auth';
                    clearTokens();
                }
            })
            .catch(error => {
                throw Error('Network Error!');
            })
        }
        else {
            return resp.json();
        }
    })
    .catch(error => {
        throw Error('Network Error!');
    })
}