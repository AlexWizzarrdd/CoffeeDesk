import { makeAutoObservable } from "mobx";

type UserRole = 'employee' | 'manager' | 'admin';

export type User = {
    firstName: string;
    lastName: string;
    phone: string;
    id: number;
    role: UserRole;
}

class UserModel {
    firstName: string = '';
    lastName: string = '';
    phone: string = '';
    id: number | null = null;
    role: string = '';

    constructor() {
        makeAutoObservable(this)
    }

    setUser(user: User) {
        this.firstName = user['firstName'];
        this.lastName = user['lastName'];
        this.phone = user['phone'];
        this.id = user['id'];
        this.role = user['role'];
    }
}

export const userModel = new UserModel();