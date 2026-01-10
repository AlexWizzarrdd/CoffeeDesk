import { Activity } from "react";
import { useAuthContext } from "@/hooks/authHooks";

type DayModalProps = {
  date: Date | null;
  isOpen: boolean;
  closeModal: () => void;
};

const MONTHS = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
];

export const DayModal = ({ date, isOpen, closeModal }: DayModalProps) => {
  const { user } = useAuthContext();

  if (!isOpen || !date) return null;

  const isManagerLike = user.role === "manager" || user.role === "admin";

  return (
    <Activity mode="visible">
      <div className="modal modal--round">
        <button className="modal__exit" onClick={closeModal}>
          ✕
        </button>

        <div className="modal__header text-center">
          <span className="modal__day">{date.getDate()}</span>{" "}
          {MONTHS[date.getMonth()]} {date.getFullYear()}
        </div>

        <div className="modal__content">
          <p className="text-muted">Смен пока нет</p>

          {isManagerLike && (
            <button className="button button-primary mt-12">
              ➕ Добавить смену
            </button>
          )}
        </div>
      </div>
    </Activity>
  );
};