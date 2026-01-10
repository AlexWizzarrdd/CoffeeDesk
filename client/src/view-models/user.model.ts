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