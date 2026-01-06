import { useEffect, useState } from "react";
import { Dropdown } from "@/ui-kit/Dropdown/Dropdown";
import { DayModal } from "@/components/Modal/DayModal";
import type { User } from "@/view-models/user.model";
import { getUser } from "@/services/user.service";

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]

const getCurrWeek = () => {
    const currDate = new Date();
    const currWeekday = currDate.getDay();

    if (currWeekday === 0) {
        currDate.setDate(currDate.getDate() - 6);
    } 
    else {
        currDate.setDate(currDate.getDate() - currWeekday + 1);
    }

    const days = Array(7);
    for (let i = 0; i < days.length; i++) {
        days[i] = new Date(currDate);
        currDate.setDate(currDate.getDate() + 1);
    }

    return days;
}

export const ProfilePage = () => {
    const [selectedDate, setSelectedDate] = useState<Date|null>(null);
    const [selectedAddress, setSelectedAddress] = useState<string>('Выберете адрес:')
    const [user, setUser] = useState<User|null>(null);

    useEffect(() => {
        getUser()
        .then(user => setUser(user))
        .catch(error => error.message)
    }, [])

    if (!user) return <div>Loading.....</div>;

    const week = getCurrWeek();
    const addressess = ['Пантелеевой 21', 'Пантелеевой 22', 'Пантелеевой 23', 'Пантелеевой 24', 'Пантелеевой 25', 'Пантелеевой 26'];
    return <div className="background-1">
        <div className="page profile-page">
            <main className="profile">
                <header className="flex align-start profile__bio">
                    <img className="profile__avatar" src="/placeholder.svg" />
                    <div className="flex flex-column justify-center">
                        <p className="profile__name">{user.first_name} {user.last_name}</p>
                        <p className="profile__job">Бариста</p>
                    </div>
                </header>
                <div className="wrapper profile-wrapper">
                    <div className="profile__row">
                        <span className="profile__row-name">Номер телефона:</span>
                        <span className="profile__row-value">{user.phone}</span>
                    </div>
                    <div className="profile__row">
                        <span className="profile__row-name">E-mail:</span>
                        <span className="profile__row-value">{user.email}</span>
                    </div>
                    <div className="profile__row profile__row--end">
                        <span className="profile__row-name">Изменить пароль</span>
                    </div>
                </div>
                <div className="text-center">
                    <span className="profile__text">Рабочие смены на </span>
                    <Dropdown 
                    items={addressess} 
                    selectItem={setSelectedAddress} 
                    activeItem={selectedAddress} 
                    selectedItemClass="profile__text" 
                    className="profile-dropdown"
                    theme="semiDark" /></div>
                <div className="profile__weekdays">
                    {week.map((day, i) => <span className="profile__weekday profile__weekday--active" onClick={() => setSelectedDate(day)}>{WEEKDAYS[i]}</span>)}
                </div>
                <DayModal date={selectedDate} isOpen={Boolean(selectedDate)} closeModal={() => setSelectedDate(null)} theme="round" />
            </main>
        </div>
    </div>
}