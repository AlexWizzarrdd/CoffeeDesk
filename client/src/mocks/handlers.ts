import { http, HttpResponse } from 'msw';

export const handlers = [
    http.post(`/api/auth/login/`, () => {
        return HttpResponse.json({
            access: "fake-token",
            refresh: "fake-refresh"
        },
        { 
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        })
    }),
    http.post('/api/auth/register/', () => {
        return HttpResponse.json({
                "id": 7,
                "email": "test@mail.com",
                "first_name": "Иван",
                "last_name": "Иванов",
                "phone": "+79991234567",
                "role": "employee",
                "is_approved": false,
                "is_active": false
            },
        {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }),
    http.get('/api/auth/me/', () => {
        return HttpResponse.json({
            "id": 7,
            "email": "test@mail.com",
            "first_name": "Иван",
            "last_name": "Иванов",
            "phone": "+79991234567",
            "role": "employee",
            "is_approved": false,
            "is_active": false
        },
        {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        })
    }),
    http.get('/api/auth/token/refresh/', () => {
        console.log('обновление')
        return HttpResponse.json({
            "access": 'fake-token2',
        },
        {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        })
    })
]