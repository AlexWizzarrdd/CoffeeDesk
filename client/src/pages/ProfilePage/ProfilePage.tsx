import { Dropdown } from "@/ui-kit/Dropdown/Dropdown";
import { useEffect } from "react";

export const ProfilePage = () => {
    useEffect(() => {

    })
    const addressess = ['Пантелеевой 21', 'Пантелеевой 22', 'Пантелеевой 23', 'Пантелеевой 24', 'Пантелеевой 25', 'Пантелеевой 26'];
    return <div className="background-1">
        <div className="page profile-page">
            <main className="profile">
                <header className="flex align-start profile__bio">
                    <img className="profile__avatar" src="/placeholder.svg" />
                    <div className="flex flex-column justify-center">
                        <p className="profile__name">Кигимон Юлия Андреевна</p>
                        <p className="profile__job">Бариста</p>
                    </div>
                </header>
                <div className="wrapper profile-wrapper">
                    <div className="profile__row">
                        <span className="profile__row-name">Номер телефона:</span>
                        <span className="profile__row-value">+7 994 567 38-94</span>
                    </div>
                    <div className="profile__row">
                        <span className="profile__row-name">E-mail:</span>
                        <span className="profile__row-value">Kigimon_juli@mail.com</span>
                    </div>
                    <div className="profile__row profile__row--end">
                        <span className="profile__row-name">Изменить пароль</span>
                    </div>
                </div>
                <div className="text-center">
                    <span className="profile__text">Рабочие смены на </span>
                    <Dropdown 
                    items={addressess} 
                    selectItem={() => console.log('address')} 
                    activeItem={'Пантелеевой 21'} 
                    selectedItemClass="profile__text" 
                    className="profile-dropdown"
                    theme="semiDark" /></div>
                <div className="profile__weekdays">
                    <span className="profile__weekday">Пн</span>
                    <span className="profile__weekday">Вт</span>
                    <span className="profile__weekday profile__weekday--active">Ср</span>
                    <span className="profile__weekday profile__weekday--active">Чт</span>
                    <span className="profile__weekday">Пт</span>
                    <span className="profile__weekday">Сб</span>
                    <span className="profile__weekday profile__weekday--active">Вс</span>
                </div>
            </main>
        </div>
    </div>
}