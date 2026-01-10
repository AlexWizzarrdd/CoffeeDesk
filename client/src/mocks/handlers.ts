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
            "role": "manager",
            "is_approved": true,
            "is_active": true
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
    }),
    http.get('/api/manager/users/', () => {
        return HttpResponse.json([
            {
                "id": 1,
                "email": "test@example.com",
                "first_name": "Иван",
                "last_name": "Тестов",
                "phone": "+79990110000",
                "role": "employee",
                "is_approved": false,
                "is_active": false
            },
            {
                "id": 2,
                "email": "testov@example.com",
                "first_name": "Илья",
                "last_name": "Тестов",
                "phone": "+79990000330",
                "role": "employee",
                "is_approved": true,
                "is_active": true
            },
            {
                "id": 3,
                "email": "testiy@example.com",
                "first_name": "Инокентий",
                "last_name": "Тестов",
                "phone": "+79990022000",
                "role": "employee",
                "is_approved": false,
                "is_active": false
            },
        ],
        {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        })
    }),
]