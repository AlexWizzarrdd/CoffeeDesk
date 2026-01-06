import { getToken } from "../api/tokenApi"

type LoginData = {
    phone: string,
    password: string
}

type SignupData = {
    "password": string,
    "first_name": string,
    "last_name": string,
    "phone": string
}

export const logIn = (data: LoginData) => {
    const url = '/api/auth/login/';
    return fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    }).then(resp => {
        if (!resp.ok) {
            throw new Error('Network error!');
        }
        return resp.json();
    });
}

export const signUp = (data: SignupData) => {
    const url = '/api/auth/register/';
    return fetch(url, {
        method: 'POST',
        body: JSON.stringify(data)
    })
    .then(resp => resp.json());
}

export const refreshAuth = () => {
    const url = '/api/auth/token/refresh/';
    const token = getToken('access');
    return fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
}