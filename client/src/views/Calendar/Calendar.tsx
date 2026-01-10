// client/src/views/Calendar/Calendar.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Dropdown } from "@/ui-kit/Dropdown/Dropdown";
import { YearDropdown } from "./components/YearDropdown";
import { DayModal } from "@/components/Modal/DayModal";
import ArrowIcon from "@/assets/icons/arrow.svg?react";
import { getShifts, type Shift, generateMonthShifts } from "@/services/schedule.service";
import { useAuthContext } from "@/hooks/authHooks";
import { Button } from "@/ui-kit/Button/Button";

const MONTHS = [
  "Январь","Февраль","Март","Апрель","Май","Июнь",
  "Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь",
];

const toISODate = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

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

export const Calendar = () => {
  const { user } = useAuthContext();
  const isManagerLike = user.role === "manager" || user.role === "admin";

  const date = new Date();
  const [month, setMonth] = useState<number>(date.getMonth());
  const [year, setYear] = useState<number>(date.getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(false);

  const days = useMemo(() => createDays(month, year), [month, year]);

  // диапазон для загрузки смен = от первого дня грида до последнего
  const range = useMemo(() => {
    const from = days[0] ? toISODate(days[0]) : toISODate(new Date(year, month, 1));
    const to = days[days.length - 1]
      ? toISODate(days[days.length - 1])
      : toISODate(new Date(year, month + 1, 0));
    return { from, to };
  }, [days, month, year]);

  const shiftsByDate = useMemo(() => {
    const map = new Map<string, Shift[]>();
    for (const s of shifts) {
      const key = s.date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return map;
  }, [shifts]);

  // ✅ подсветка: есть ли смена у текущего пользователя в этот день
  const hasMyShift = (isoDate: string) => {
    const dayShifts = shiftsByDate.get(isoDate) || [];
    return dayShifts.some((s) => s.employee_id === user.id);
  };

  const selectedISO = selectedDate ? toISODate(selectedDate) : null;
  const selectedDayShifts = selectedISO ? shiftsByDate.get(selectedISO) || [] : [];

  const reload = async () => {
    try {
      setLoading(true);
      const data = await getShifts(range.from, range.to);
      setShifts(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.from, range.to]);

  useEffect(() => {
    const dateHandler = (event: KeyboardEvent) => {
      if (event.code === "ArrowLeft") {
        setMonth((prev) => {
          const next = getNextMonth(prev, -1);
          if (next === 11 && prev === 0) setYear((s) => s - 1);
          return next;
        });
      } else if (event.code === "ArrowRight") {
        setMonth((prev) => {
          const next = getNextMonth(prev, 1);
          if (next === 0 && prev === 11) setYear((s) => s + 1);
          return next;
        });
      }
    };
    document.addEventListener("keydown", dateHandler);
    return () => document.removeEventListener("keydown", dateHandler);
  }, []);

  const generateMonth = async () => {
    const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;

    const ok = window.confirm(
      `Автоматически распределить смены 2/2 на ${MONTHS[month]} ${year}?\n\n` +
        `• роли: employee + manager\n` +
        `• по 2 человека в день\n` +
        `• смена 09:00–18:00\n` +
        `• существующие смены НЕ перезаписываем`
    );

    if (!ok) return;

    try {
      setLoading(true);
      await generateMonthShifts({
        month: monthStr,
        per_day: 2,
        start_time: "09:00",
        end_time: "18:00",
        include_roles: ["employee", "intern", "manager"],
        overwrite: false,
        comment: "Автогенерация 2/2",
      });
      await reload();
      alert("Смены успешно сгенерированы");
    } catch (e: any) {
      alert(e?.message || "Ошибка автогенерации");
    } finally {
      setLoading(false);
    }
  };

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

          {isManagerLike ? (
            <Button classess="button-sm" onClick={generateMonth} disabled={loading}>
              ⚙️ Автораспределить
            </Button>
          ) : null}

          {loading ? <span style={{ marginLeft: 12 }}>⏳</span> : null}
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
            const iso = toISODate(day);
            const count = shiftsByDate.get(iso)?.length || 0;

            const inCurrentMonth = day.getMonth() === month && day.getFullYear() === year;
            const myShift = hasMyShift(iso);

            const dayClass = [
              "calendar__day",
              inCurrentMonth ? "" : "calendar__day--other-month",
              myShift ? "calendar__day--work" : "calendar__day--free",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <div
                key={`${iso}-${i}`}
                className={dayClass}
                onClick={() => setSelectedDate(day)}
              >
                {day.getDate()}
                {count > 0 ? (
                  <div style={{ fontSize: 12, marginTop: 4 }}>смен: {count}</div>
                ) : null}
              </div>
            );
          })}

          <DayModal
            date={selectedDate}
            isOpen={Boolean(selectedDate)}
            closeModal={() => setSelectedDate(null)}
            shifts={selectedDayShifts}
            onCreated={() => reload()}
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