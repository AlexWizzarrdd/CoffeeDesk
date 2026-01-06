import React, { useEffect, useState } from "react";
import { Dropdown } from "@/ui-kit/Dropdown/Dropdown";
import { YearDropdown } from "./components/YearDropdown";
import { DayModal } from "@/components/Modal/DayModal";
import ArrowIcon from '@/assets/icons/arrow.svg?react';

const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

const createDays = (month: number, year: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startWeekday = (firstDay.getDay() + 6) % 7;
    const endWeekday = (lastDay.getDay() + 6) % 7;

    const startDate = new Date(year, month, 1 - startWeekday);
    const endDate = new Date(year, month, lastDay.getDate() + (6 - endWeekday));

    const days: Date[] = [];
    const curr = new Date(startDate);

    while (curr <= endDate) {
        for (let i = 0; i < 7; i++) {
            days.push(new Date(curr));
            curr.setDate(curr.getDate() + 1);
        }
    }

    return days;
};

const getNextMonth = (monthInd: number, offset: number) => {
    const nextMonth = monthInd + offset;
    if (nextMonth > 11) {
        return 0;
    }
    if (nextMonth < 0) {
        return 11;
    }
    return nextMonth;
}

const nextMonthHandler = (
    monthInd: number,
    offset: number,
    setMonth: React.Dispatch<React.SetStateAction<number>>,
    setYear: React.Dispatch<React.SetStateAction<number>>) => {
        const nextMonth = getNextMonth(monthInd, offset);
        if (nextMonth === 11 && monthInd === 0) {
            setYear((state: number) => state - 1);
        }
        else if (nextMonth === 0 && monthInd === 11) {
            setYear((state: number) => state + 1);
        }
        
        setMonth(nextMonth);
    }

export const Calendar = () => {
    const date = new Date();
    const [month, setMonth] = useState<number>(date.getMonth());
    const [year, setYear] = useState<number>(date.getFullYear());
    const [selectedDate, setSelectedDate] = useState<Date|null>(null);
    const days = createDays(month, year);

    useEffect(() => {
        const dateHandler = (event: KeyboardEvent) => {
            if (event.code === 'ArrowLeft') {
                setMonth((prevMonth) => {
                    const nextMonth = getNextMonth(prevMonth, -1);
                    if (nextMonth === 11 && prevMonth === 0) {
                        setYear((state) => state - 1);
                    }
                    return nextMonth;
                })
            }
            else if (event.code === 'ArrowRight') {
                setMonth((prevMonth) => {
                    const nextMonth = getNextMonth(prevMonth, 1);
                    if (nextMonth === 0 && prevMonth === 11) {
                        setYear((state) => state + 1);
                    }
                    return nextMonth;
                })
            }
        }
        document.addEventListener('keydown', dateHandler);

        return () => {
            document.removeEventListener('keydown', dateHandler);
        }
    }, [])
    
    return <div className="wrapper calendar-wrapper flex">
        <button className="calendar__button calendar__button--prev" onClick={() => nextMonthHandler(month, -1, setMonth, setYear)}>
            <ArrowIcon />
        </button>
        <div className="calendar">
            <header className="calendar__header flex">
                <Dropdown items={MONTHS} activeItem={MONTHS[month]} selectItem={(item: string) => {
                    for (let i = 0; i < MONTHS.length; i++) {
                        if (MONTHS[i] === item) {
                            setMonth(i);
                        }
                    }
                }} selectedItemClass="calendar__header-month" />
                <YearDropdown year={year} setYear={setYear} />
            </header>
            <div className="calendar__weekdays flex">
                <span className="calendar__weekday">Пн</span>
                <span className="calendar__weekday">Вт</span>
                <span className="calendar__weekday">Ср</span>
                <span className="calendar__weekday">Чт</span>
                <span className="calendar__weekday">Пт</span>
                <span className="calendar__weekday">Сб</span>
                <span className="calendar__weekday">Вс</span>
            </div>
            <div className="calendar__days">
                {days.map((day, i) => <div key={`${day}${i}`} className="calendar__day" onClick={() => setSelectedDate(day)}>{day.getDate()}</div>)}
                <DayModal date={selectedDate} isOpen={Boolean(selectedDate)} closeModal={() => setSelectedDate(null)} />
            </div>
        </div>
        <button className="calendar__button calendar__button--next" onClick={() => nextMonthHandler(month, 1, setMonth, setYear)}>
            <ArrowIcon />
        </button>
    </div>
}