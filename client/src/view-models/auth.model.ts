import { makeAutoObservable, runInAction } from 'mobx';
import type { FormEvent } from 'react';
import { isValidPhone, isValidName } from '../utils/validation';
import { logIn, signUp } from '../services/auth.service';
import { setToken, clearTokens } from '../api/tokenApi';

class LoginModel {
    phone: string = '';
    password: string = '';
    phoneError: string = '';
    passwordError: string = '';
    networkError: string = '';

    constructor() {
        makeAutoObservable(this)
    }

    setPhone = (payload: string) => {
        if (payload === '+') {
            this.phone = '';
        } else {
            this.phone = payload.startsWith('+7') ? payload : `+7${payload}`;
        }
    }

    setPassword = (payload: string) => {
        this.password = payload;
    }

    clearErrors = () => {
        this.phoneError = '';
        this.passwordError = '';
        this.networkError = '';
    }

    loginUser = (event: FormEvent) => {
        event.preventDefault();
        this.clearErrors();

        if (!isValidPhone(this.phone)) {
            this.phoneError = 'Неверный формат (+7XXXXXXXXXX)';
            return;
        }

        logIn({ phone: this.phone, password: this.password })
            .then((tokens) => {
                setToken(tokens.access, 'access');
                setToken(tokens.refresh, 'refresh');

                // редирект только ПОСЛЕ успешного логина
                window.location.href = '/';
            })
            .catch(() => {
                runInAction(() => {
                    this.networkError = 'Неверный телефон или пароль';
                });
                clearTokens();
            });
    }
}

class SignupModel {
    firstName: string = '';
    lastName: string = '';
    phone: string = '';
    password: string = '';
    confirmedPassword: string = '';

    firstNameError: string = '';
    lastNameError: string = '';
    phoneError: string = '';
    passwordError: string = '';
    confirmedPasswordError: string = '';
    networkError: string = '';

    isRegistrate: boolean = false;
    serverAnswer: string = '';

    constructor() {
        makeAutoObservable(this)
    }

    setFirstName = (payload: string) => {
        this.firstName = payload;
    }

    setLastName = (payload: string) => {
        this.lastName = payload;
    }

    setPhone = (payload: string) => {
        if (payload === '+') {
            this.phone = '';
        } else {
            this.phone = payload.startsWith('+7') ? payload : `+7${payload}`;
        }
    }

    setPassword = (payload: string) => {
        this.password = payload;
    }

    setConfirmedPassword = (payload: string) => {
        this.confirmedPassword = payload;
    }

    clearErrors = () => {
        this.firstNameError = '';
        this.lastNameError = '';
        this.phoneError = '';
        this.passwordError = '';
        this.confirmedPasswordError = '';
    }

    validateData = () => {
        if (!isValidPhone(this.phone)) {
            this.phoneError = 'Неверный формат (+7XXXXXXXXXXX)';
        }
        if (!isValidName(this.firstName)) {
            this.firstNameError = 'Какое интересное имя';
        }
        if (!isValidName(this.lastName)) {
            this.lastNameError = 'Какая интересная фамилия';
        }
        if (this.password !== this.confirmedPassword) {
            this.confirmedPasswordError = 'Пароли не совпадают';
        }
    }

    hasErrors = () => {
        return this.phoneError || this.firstNameError || this.lastNameError || this.confirmedPasswordError;
    }

    registrateUser = (event: FormEvent) => {
        event.preventDefault();
        this.clearErrors();

        this.validateData();
        if (this.hasErrors()) {
            return;
        }

        const response = signUp({
            'first_name': this.firstName,
            'last_name': this.lastName,
            'password': this.password,
            'phone': this.phone
        })

        response
        .then(user => {
            runInAction(() => {
                this.isRegistrate = true;
                if (!user.is_approved) {
                    this.serverAnswer = 'Ваша учётная запись ожидает подтверждения менеджером';
                }
                else if (!user.is_active) {
                    this.serverAnswer = 'Аккаунт не активен';
                }
            })


        })
        .catch(error => {
            runInAction(() => {
                this.networkError = error.status;
            })
        })
    }
}

export const loginModel = new LoginModel();
export const signupModel = new SignupModel();