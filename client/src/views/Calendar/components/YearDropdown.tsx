import ArrowIcon from '@/assets/icons/smallArrow.svg?react';
import { Dropdown } from '@/ui-kit/Dropdown/Dropdown';
import { memo, useEffect, useState, type Dispatch, type KeyboardEvent, type SetStateAction, type WheelEvent } from 'react';

type DropdownProps = {
    setYear: (value: number) => void,
    year: number
}

const yearScrollHandler = (startYear: number, setStartYear: Dispatch<SetStateAction<number>>) => {
    return (event: WheelEvent) => event.deltaY < 0 ? setStartYear(startYear - 1) : setStartYear(startYear + 1);
}

const yearKeyHandler = (startYear: number, setStartYear: Dispatch<SetStateAction<number>>) => {
    return (event: KeyboardEvent) => {
        if (event.code === 'ArrowUp') {
            setStartYear(startYear - 1)
        }
        else if (event.code === 'ArrowDown') {
            setStartYear(startYear + 1)
        }
    };
}

export const YearDropdown = memo(({ setYear, year }: DropdownProps) => {
    const [selectedYear, setSelectedYear] = useState(year);
    const [startYear, setStartYear] = useState(year);
    useEffect(() => {
        setSelectedYear(year);
    }, [year]);
    const years = Array.from({ length: 12 }, (_, i) => startYear - 6 + i);
    return <Dropdown items={years} selectItem={(item: number) => {
        setYear(item);
        setSelectedYear(item);
    }} 
    activeItem={selectedYear} 
    wheelHandler={yearScrollHandler(startYear, setStartYear)} 
    keyDownHandler={yearKeyHandler(startYear, setStartYear)} selectedItemClass='calendar__header-year' />
})