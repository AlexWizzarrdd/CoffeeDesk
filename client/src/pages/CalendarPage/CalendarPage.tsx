import { Calendar } from "@/views/Calendar/Calendar";
import { Dropdown } from "@/ui-kit/Dropdown/Dropdown";
import { useState } from "react";

export const CalendarPage = () => {
    const [currAddress, setCurrAddress] = useState('Выберите адрес');
    const addressess = ['Пантелеевой 21', 'Пантелеевой 22', 'Пантелеевой 23', 'Пантелеевой 24', 'Пантелеевой 25', 'Пантелеевой 26'];
    return <div className="background-1">
        <div className="page calendar-page">
            <main>
                <Calendar />
                <Dropdown items={addressess} selectItem={setCurrAddress} activeItem={currAddress} className="calendar-dropdown" withIcon={true} theme="primary" />
            </main>
        </div>
    </div>
}