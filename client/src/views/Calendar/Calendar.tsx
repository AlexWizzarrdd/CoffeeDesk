import React, { useEffect, useMemo, useState } from "react";
import { Dropdown } from "@/ui-kit/Dropdown/Dropdown";
import { YearDropdown } from "./components/YearDropdown";
import { DayModal } from "@/components/Modal/DayModal";
import ArrowIcon from "@/assets/icons/arrow.svg?react";
import { getShifts, type Shift } from "@/services/shift.service";
import { useAuthContext } from "@/hooks/authHooks";

const MONTHS = [
  "Январь","Февраль","Март","Апрель","Май","Июнь",
  "Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь",
];

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
  if (nextMonth > 11) return 0;
  if (nextMonth < 0) return 11;
  return nextMonth;
};

const nextMonthHandler = (
  monthInd: number,
  offset: number,
  setMonth: React.Dispatch<React.SetStateAction<number>>,
  setYear: React.Dispatch<React.SetStateAction<number>>
) => {
  const nextMonth = getNextMonth(monthInd, offset);
  if (nextMonth === 11 && monthInd === 0) setYear((s) => s - 1);
  else if (nextMonth === 0 && monthInd === 11) setYear((s) => s + 1);
  setMonth(nextMonth);
};

const toISODate = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export const Calendar = () => {
  const date = new Date();
  const [month, setMonth] = useState<number>(date.getMonth());
  const [year, setYear] = useState<number>(date.getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(false);

  const { user } = useAuthContext();
  const isManagerLike = user.role === "manager" || user.role === "admin";

  const days = useMemo(() => createDays(month, year), [month, year]);

  const range = useMemo(() => {
    // Берем диапазон: от первого дня сетки до последнего
    const from = new Date(days[0]);
    const to = new Date(days[days.length - 1]);
    return { fromISO: toISODate(from), toISO: toISODate(to) };
  }, [days]);

  const reloadShifts = () => {
    setLoading(true);
    // employee получит только свои смены (бэк так решит),
    // manager/admin может позже выбирать user_id (сейчас оставим без фильтра)
    getShifts(range.fromISO, range.toISO)
      .then((data) => setShifts(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reloadShifts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.fromISO, range.toISO]);

  useEffect(() => {
    const dateHandler = (event: KeyboardEvent) => {
      if (event.code === "ArrowLeft") {
        setMonth((prevMonth) => {
          const nextMonth = getNextMonth(prevMonth, -1);
          if (nextMonth === 11 && prevMonth === 0) setYear((s) => s - 1);
          return nextMonth;
        });
      } else if (event.code === "ArrowRight") {
        setMonth((prevMonth) => {
          const nextMonth = getNextMonth(prevMonth, 1);
          if (nextMonth === 0 && prevMonth === 11) setYear((s) => s + 1);
          return nextMonth;
        });
      }
    };
    document.addEventListener("keydown", dateHandler);
    return () => document.removeEventListener("keydown", dateHandler);
  }, []);

  // Быстрый индекс: "YYYY-MM-DD" -> смены дня
  const shiftsByDay = useMemo(() => {
    const map = new Map<string, Shift[]>();
    for (const s of shifts) {
      const key = s.start_at.slice(0, 10); // "YYYY-MM-DD"
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return map;
  }, [shifts]);

  return (
    <div className="wrapper calendar-wrapper flex">
      <button
        className="calendar__button calendar__button--prev"
        onClick={() => nextMonthHandler(month, -1, setMonth, setYear)}
      >
        <ArrowIcon />
      </button>

      <div className="calendar">
        <header className="calendar__header flex">
          <Dropdown
            items={MONTHS}
            activeItem={MONTHS[month]}
            selectItem={(item: string) => {
              for (let i = 0; i < MONTHS.length; i++) {
                if (MONTHS[i] === item) setMonth(i);
              }
            }}
            selectedItemClass="calendar__header-month"
          />
          <YearDropdown year={year} setYear={setYear} />
          <span style={{ marginLeft: "auto", opacity: 0.7, fontSize: 12 }}>
            {loading ? "Загрузка смен..." : isManagerLike ? "Менеджерский режим" : "Мой график"}
          </span>
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
          {days.map((day, i) => {
            const key = toISODate(day);
            const dayShifts = shiftsByDay.get(key) || [];

            return (
              <div
                key={`${day}${i}`}
                className="calendar__day"
                onClick={() => setSelectedDate(day)}
              >
                <div>{day.getDate()}</div>

                {/* Мини-отображение смен */}
                {dayShifts.length ? (
                  <div style={{ marginTop: 6, fontSize: 10, opacity: 0.9 }}>
                    {dayShifts.slice(0, 2).map((s) => {
                      const st = s.start_at.slice(11, 16);
                      const en = s.end_at.slice(11, 16);
                      return (
                        <div key={s.id}>
                          {st}-{en} {s.comment ? `• ${s.comment}` : ""}
                        </div>
                      );
                    })}
                    {dayShifts.length > 2 ? <div>+ ещё {dayShifts.length - 2}</div> : null}
                  </div>
                ) : null}
              </div>
            );
          })}

          <DayModal
            date={selectedDate}
            isOpen={Boolean(selectedDate)}
            closeModal={() => setSelectedDate(null)}
            // важное: добавим callback чтобы после сохранения смены обновить календарь
            onSaved={() => reloadShifts()}
          />
        </div>
      </div>

      <button
        className="calendar__button calendar__button--next"
        onClick={() => nextMonthHandler(month, 1, setMonth, setYear)}
      >
        <ArrowIcon />
      </button>
    </div>
  );
};