import { useState } from "react";
import { Login } from "../../views/Auth/Login";
import { Registration } from "../../views/Auth/Registration";

export const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    return <div className="page auth-page background-1">
        <img src="/Logo.svg" className="auth-logo" />
        {isLogin ? <Login setIsLogin={setIsLogin} /> : <Registration setIsLogin={setIsLogin} />}
    </div>
}