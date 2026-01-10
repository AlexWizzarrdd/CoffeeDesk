import { makeAutoObservable, runInAction } from "mobx";
import type { FormEvent } from "react";
import { isValidPhone, isValidName } from "../utils/validation";
import { logIn, signUp } from "../services/auth.service";
import { setToken, clearTokens } from "../api/tokenApi";

class LoginModel {
  phone: string = "";
  password: string = "";
  phoneError: string = "";
  passwordError: string = "";
  networkError: string = "";

  constructor() {
    makeAutoObservable(this);
  }

  setPhone = (payload: string) => {
    if (payload === "+") {
      this.phone = "";
    } else {
      this.phone = payload.startsWith("+7") ? payload : `+7${payload}`;
    }
  };

  setPassword = (payload: string) => {
    this.password = payload;
  };

  clearErrors = () => {
    this.phoneError = "";
    this.passwordError = "";
    this.networkError = "";
  };

  loginUser = (event: FormEvent) => {
    event.preventDefault();
    this.clearErrors();

    if (!isValidPhone(this.phone)) {
      this.phoneError = "Неверный формат (+7XXXXXXXXXX)";
      return;
    }

    logIn({ phone: this.phone, password: this.password })
      .then((tokens) => {
        setToken(tokens.access, "access");
        setToken(tokens.refresh, "refresh");
        window.location.href = "/";
      })
      .catch(() => {
        runInAction(() => {
          this.networkError = "Неверный телефон или пароль";
        });
        clearTokens();
      });
  };
}

class SignupModel {
  firstName: string = "";
  lastName: string = "";
  surname: string = "";
  phone: string = "";
  password: string = "";
  confirmedPassword: string = "";

  firstNameError: string = "";
  lastNameError: string = "";
  surnameError: string = "";
  phoneError: string = "";
  passwordError: string = "";
  confirmedPasswordError: string = "";
  networkError: string = "";

  isRegistrate: boolean = false;
  serverAnswer: string = "";

  constructor() {
    makeAutoObservable(this);
  }

  setFirstName = (payload: string) => {
    this.firstName = payload;
  };

  setLastName = (payload: string) => {
    this.lastName = payload;
  };

  setSurname = (payload: string) => {
    this.surname = payload;
  };

  setPhone = (payload: string) => {
    if (payload === "+") {
      this.phone = "";
    } else {
      this.phone = payload.startsWith("+7") ? payload : `+7${payload}`;
    }
  };

  setPassword = (payload: string) => {
    this.password = payload;
  };

  setConfirmedPassword = (payload: string) => {
    this.confirmedPassword = payload;
  };

  clearErrors = () => {
    this.firstNameError = "";
    this.lastNameError = "";
    this.surnameError = "";
    this.phoneError = "";
    this.passwordError = "";
    this.confirmedPasswordError = "";
    this.networkError = "";
    this.serverAnswer = "";
  };

  validateData = () => {
    if (!isValidName(this.firstName)) {
      this.firstNameError = "Введите корректное имя";
    }
    if (!isValidName(this.lastName)) {
      this.lastNameError = "Введите корректную фамилию";
    }
    if (!isValidName(this.surname)) {
      this.surnameError = "Введите корректное отчество";
    }
    if (!isValidPhone(this.phone)) {
      this.phoneError = "Неверный формат (+7XXXXXXXXXX)";
    }
    if (this.password !== this.confirmedPassword) {
      this.confirmedPasswordError = "Пароли не совпадают";
    }
  };

  hasErrors = () => {
    return Boolean(
      this.phoneError ||
        this.firstNameError ||
        this.lastNameError ||
        this.surnameError ||
        this.confirmedPasswordError
    );
  };

  // DRF ошибки часто приходят как объект: {phone: ["..."], password: ["..."], ...}
  private setBackendErrors = (payload: any) => {
    const pick = (key: string) =>
      Array.isArray(payload?.[key]) ? payload[key][0] : "";

    const nonField =
      Array.isArray(payload?.non_field_errors) && payload.non_field_errors[0]
        ? payload.non_field_errors[0]
        : payload?.detail || "";

    this.phoneError = pick("phone") || this.phoneError;
    this.passwordError = pick("password") || this.passwordError;
    this.firstNameError = pick("first_name") || this.firstNameError;
    this.lastNameError = pick("last_name") || this.lastNameError;
    this.surnameError = pick("surname") || this.surnameError;

    if (nonField) {
      this.networkError = String(nonField);
    } else if (!this.networkError) {
      this.networkError = "Не удалось зарегистрироваться";
    }
  };

  registrateUser = (event: FormEvent) => {
    event.preventDefault();
    this.clearErrors();

    this.validateData();
    if (this.hasErrors()) return;

    signUp({
      first_name: this.firstName,
      last_name: this.lastName,
      surname: this.surname,
      password: this.password,
      phone: this.phone,
    })
      .then((user) => {
        runInAction(() => {
          this.isRegistrate = true;

          // по твоей логике новый пользователь будет: is_active=false, is_approved=false
          if (user?.is_approved === false) {
            this.serverAnswer =
              "Ваша учётная запись ожидает подтверждения менеджером";
          } else if (user?.is_active === false) {
            this.serverAnswer = "Аккаунт не активен";
          } else {
            this.serverAnswer = "Регистрация успешна";
          }
        });
      })
      .catch((payload) => {
        runInAction(() => {
          this.setBackendErrors(payload);
        });
      });
  };
}

export const loginModel = new LoginModel();
export const signupModel = new SignupModel();