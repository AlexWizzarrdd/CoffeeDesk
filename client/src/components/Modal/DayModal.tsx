import { Activity, useEffect, useRef } from "react";

type DayModalProps = {
    date: Date|null,
    isOpen: boolean,
    closeModal: () => void,
    data?: number|null,
    theme?: string
}

const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

const themes: { [key: string]: string } = {
    'round': 'modal--round'
}

export const DayModal = ({ date, data, isOpen, closeModal, theme }: DayModalProps) => {
    const currModal = useRef(null);
    useEffect(() => {
        const controller = new AbortController();

        document.addEventListener('mousedown', (event) => {
            if (currModal.current !== event.target) {
                closeModal();
            }
        }, { signal: controller.signal });
        return () => controller.abort()
    })
    return <Activity mode={isOpen ? 'visible' : 'hidden'}>
        <div className={theme ? `modal ${themes[theme]}` : "modal"} ref={currModal}>
            <div className="modal__header text-center"><span className="modal__day">{date?.getDate()}</span> {MONTHS[date?.getMonth() || 0]}</div>
            <button className="modal__exit" onClick={() => closeModal()}>X</button>
        </div>
    </Activity>
}