import { observer } from "mobx-react-lite"
import { FormField } from "../../ui-kit/FormField/FormField"
import { Button } from "../../ui-kit/Button/Button"
import { loginModel } from "../../view-models/auth.model"

type LoginProp = {
    setIsLogin: React.Dispatch<React.SetStateAction<boolean>>
}

export const Login = observer(({ setIsLogin }: LoginProp) => {
    return <div className="wrapper auth-wrapper login-wrapper flex flex-column flex-center">
        <h1 className="auth-header login-header">Авторизация</h1>
        <form className="flex flex-column flex-center w-full login-form" onSubmit={loginModel.loginUser}>
            <FormField id="phone" type="tel" value={loginModel.phone} placeholder="Введите номер телефона" cb={loginModel.setPhone} error={loginModel.phoneError} />
            <FormField id="password" type="password" value={loginModel.password} placeholder="Введите пароль" cb={loginModel.setPassword} error={loginModel.passwordError} />
            {loginModel.networkError ? <p className="error-feedback">{loginModel.networkError}</p> : null}
            <button className="auth-toggle" onClick={() => setIsLogin(false)}>Еще нет аккаунта?</button>
            <Button classess="button-sm" type="submit">Войти</Button>
        </form>
    </div>
})