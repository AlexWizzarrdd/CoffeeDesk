import { observer } from "mobx-react-lite"
import { FormField } from "../../ui-kit/FormField/FormField"
import { Button } from "../../ui-kit/Button/Button"
import { signupModel } from "../../view-models/auth.model"

type RegistrationProp = {
    setIsLogin: React.Dispatch<React.SetStateAction<boolean>>
}

export const Registration = observer(({ setIsLogin }: RegistrationProp) => {
    return <div className="wrapper auth-wrapper signup-wrapper flex flex-column flex-center">
        <h1 className="auth-header signup-header">Регистрация</h1>
        <form className="flex flex-column flex-center w-full" onSubmit={signupModel.registrateUser}>
            <FormField id="firstName" value={signupModel.firstName} placeholder="Имя" cb={signupModel.setFirstName} error={signupModel.firstNameError} />
            <FormField id="lastName" value={signupModel.lastName} placeholder="Фамилия" cb={signupModel.setLastName} error={signupModel.lastNameError} />
            <FormField id="phone" type="tel" value={signupModel.phone} placeholder="Номер телефона" cb={signupModel.setPhone} error={signupModel.phoneError} />
            <FormField id="password" type="password" value={signupModel.password} placeholder="Пароль" cb={signupModel.setPassword} error={signupModel.passwordError} />
            <FormField id="confirmedPassword" type="password" value={signupModel.confirmedPassword} placeholder="Подтвердите пароль" cb={signupModel.setConfirmedPassword} error={signupModel.confirmedPasswordError} />
            <button className="auth-toggle" onClick={() => setIsLogin(true)}>Уже есть аккаунта?</button>
            <Button classess="button-sm" type="submit">Войти</Button>
        </form>
    </div>
})