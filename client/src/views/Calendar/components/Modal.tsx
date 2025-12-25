type ModalProps = {
    day: number|null,
    month: number,
    closeModal: () => void,
    data?: number|null
}

const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

export const Modal = ({ day, month, data, closeModal }: ModalProps) => {
    return <div className="calendar-modal">
        <div className="calendar-modal__header text-center"><span className="calendar-modal__day">{day}</span> {MONTHS[month]}</div>
        <button className="calendar-modal__exit" onClick={() => closeModal()}>X</button>
    </div>
}