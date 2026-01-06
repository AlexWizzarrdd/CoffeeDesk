import { makeAutoObservable } from "mobx";

type UserRole = 'employee' | 'manager' | 'admin';

export type User = {
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
    id: number;
    role: UserRole;
    is_approved: boolean;
    is_active: boolean;
}

class UserModel {
    firstName: string = '';
    lastName: string = '';
    phone: string = '';
    email: string = '';
    id: number | null = null;
    role: UserRole = 'employee';
    isApproved: boolean = false;
    isActive: boolean = false;

    constructor() {
        makeAutoObservable(this);
        
    }

    setUser(user: User) {
        this.firstName = user['first_name'];
        this.lastName = user['last_name'];
        this.phone = user['phone'];
        this.email = user['email'];
        this.id = user['id'];
        this.role = user['role'];
        this.isActive = user['is_active'];
        this.isApproved = user['is_approved'];
    }
}

export const userModel = new UserModel();