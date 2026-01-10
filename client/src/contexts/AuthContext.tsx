import type { User } from "@/view-models/user.model";
import { createContext } from "react";

type AuthContextType = {
    user: User
}

export const AuthContext = createContext<AuthContextType|null>(null);