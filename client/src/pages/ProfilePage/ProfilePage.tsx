// client/src/pages/ProfilePage/ProfilePage.tsx
import { useEffect, useMemo, useState } from "react";
import { Dropdown } from "@/ui-kit/Dropdown/Dropdown";
import { DayModal } from "@/components/Modal/DayModal";
import { useAuthContext } from "@/hooks/authHooks";
import { getStats, type StatsResponse } from "@/services/schedule.service";

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const ROLE_LABEL: Record<string, string> = {
  employee: "Бариста",
  intern: "Стажёр",
  manager: "Менеджер",
  admin: "Управляющий",
};

const getCurrWeek = () => {
  const currDate = new Date();
  const currWeekday = currDate.getDay();

  if (currWeekday === 0) currDate.setDate(currDate.getDate() - 6);
  else currDate.setDate(currDate.getDate() - currWeekday + 1);

  const days = Array(7);
  for (let i = 0; i < days.length; i++) {
    days[i] = new Date(currDate);
    currDate.setDate(currDate.getDate() + 1);
  }
  return days;
};

const toISO = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const monthFirst = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const monthLast = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
const yesterday = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1);

const hmToMinutes = (h: number, m: number) => h * 60 + m;
const minutesToHM = (total: number) => ({
  hours: Math.max(0, Math.floor(total / 60)),
  minutes: Math.max(0, total % 60),
});
const formatHM = (h: number, m: number) => `${h}ч ${m}м`;

export const ProfilePage = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<string>("Выберете адрес:");
  const { user } = useAuthContext();

  const week = getCurrWeek();
  const addressess = [
    "Пантелеевой 21",
    "Пантелеевой 22",
    "Пантелеевой 23",
    "Пантелеевой 24",
    "Пантелеевой 25",
    "Пантелеевой 26",
  ];

  const [plannedStats, setPlannedStats] = useState<StatsResponse | null>(null);
  const [workedStats, setWorkedStats] = useState<StatsResponse | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState("");

  const now = useMemo(() => new Date(), []);
  const fromMonth = useMemo(() => toISO(monthFirst(now)), [now]);
  const toMonth = useMemo(() => toISO(monthLast(now)), [now]);

  const toWorked = useMemo(() => {
    const y = yesterday(now);
    if (y < monthFirst(now)) return null;
    return toISO(y);
  }, [now]);

  useEffect(() => {
    const load = async () => {
      setStatsLoading(true);
      setStatsError("");
      try {
        const planned = await getStats(fromMonth, toMonth, user.id);
        setPlannedStats(planned);

        if (toWorked) {
          const worked = await getStats(fromMonth, toWorked, user.id);
          setWorkedStats(worked);
        } else {
          setWorkedStats({
            from: fromMonth,
            to: fromMonth,
            count_users: 0,
            items: [],
          });
        }
      } catch (e: any) {
        setStatsError(e?.message || "Не удалось загрузить статистику");
      } finally {
        setStatsLoading(false);
      }
    };

    load();
  }, [fromMonth, toMonth, toWorked, user.id]);

  const plannedRow = plannedStats?.items?.[0];
  const workedRow = workedStats?.items?.[0];

  const plannedMinutes = plannedRow ? hmToMinutes(plannedRow.hours, plannedRow.minutes) : 0;
  const workedMinutes = workedRow ? hmToMinutes(workedRow.hours, workedRow.minutes) : 0;
  const left = minutesToHM(plannedMinutes - workedMinutes);

  const workedLabel = formatHM(workedRow?.hours || 0, workedRow?.minutes || 0);
  const plannedLabel = formatHM(plannedRow?.hours || 0, plannedRow?.minutes || 0);
  const leftLabel = formatHM(left.hours, left.minutes);

  const roleLabel = ROLE_LABEL[user.role] || user.role;

  return (
    <div className="page profile-page">
      <main className="profile">
        <header className="flex align-start profile__bio">
          <img className="profile__avatar" src="/placeholder.svg" />
          <div className="flex flex-column justify-center">
            <p className="profile__name">
              {user.first_name} {user.last_name}
            </p>
            <p className="profile__job">{roleLabel}</p>
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

          <div className="profile__row">
            <span className="profile__row-name">Часы за месяц:</span>
            <span className="profile__row-value">
              {statsLoading ? (
                "..."
              ) : statsError ? (
                statsError
              ) : (
                <>
                  <b>{workedLabel}</b> из <b>{plannedLabel}</b> (осталось: <b>{leftLabel}</b>)
                </>
              )}
            </span>
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
            theme="semiDark"
          />
        </div>

        <div className="profile__weekdays">
          {week.map((day, i) => (
            <span
              key={String(day)}
              className="profile__weekday profile__weekday--active"
              onClick={() => setSelectedDate(day)}
            >
              {WEEKDAYS[i]}
            </span>
          ))}
        </div>

        <DayModal
          date={selectedDate}
          isOpen={Boolean(selectedDate)}
          closeModal={() => setSelectedDate(null)}
          theme="round"
        />
      </main>
    </div>
  );
};