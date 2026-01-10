import { useState } from "react";
import { Login } from "../../views/Auth/Login";
import { Registration } from "../../views/Auth/Registration";

export const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    return <div className="background-1">
        <main className="page flex-column flex-center auth-page">
            <img src="/Logo.svg" className="auth-logo" />
            {isLogin ? <Login setIsLogin={setIsLogin} /> : <Registration setIsLogin={setIsLogin} />}
        </main>
    </div>
}