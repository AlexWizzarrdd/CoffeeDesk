import { Activity } from "react";
import { useAuthContext } from "@/hooks/authHooks";
import { useEffect, useMemo, useState } from "react";
import {
  createShift,
  deleteShift,
  getShifts,
  updateShift,
  type Shift,
} from "@/services/schedule.service";
import { getUsers } from "@/services/user.service";
import type { User } from "@/view-models/user.model";
import { Button } from "@/ui-kit/Button/Button";

type DayModalProps = {
  date: Date | null;
  isOpen: boolean;
  closeModal: () => void;
  theme?: string;
};

const MONTHS = [
  "января","февраля","марта","апреля","мая","июня",
  "июля","августа","сентября","октября","ноября","декабря",
];

const toISODate = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const toHHMM = (t: string) => (t?.length >= 5 ? t.slice(0, 5) : t);

const userLabel = (u: User) =>
  `${u.last_name} ${u.first_name} ${u.surname}`.replace(/\s+/g, " ").trim();

export const DayModal = ({ date, isOpen, closeModal, theme }: DayModalProps) => {
  const { user } = useAuthContext();
  const isManagerLike = user.role === "manager" || user.role === "admin";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [users, setUsers] = useState<User[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);

  // форма добавления/редактирования
  const [formEmployee, setFormEmployee] = useState<number | "">("");
  const [formStart, setFormStart] = useState("09:00");
  const [formEnd, setFormEnd] = useState("18:00");
  const [formComment, setFormComment] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingOriginalEmployee, setEditingOriginalEmployee] = useState<number | null>(null);

  // busyId:
  // -1 = сохраняем форму
  // shiftId = удаляем конкретную смену
  const [busyId, setBusyId] = useState<number | null>(null);

  const dayISO = useMemo(() => (date ? toISODate(date) : ""), [date]);

  const load = async () => {
    if (!date) return;
    setLoading(true);
    setError("");

    try {
      const from = dayISO;
      const to = dayISO;

      const [sh, us] = await Promise.all([
        getShifts(from, to),
        isManagerLike ? getUsers() : Promise.resolve([] as User[]),
      ]);

      const onlyThatDay = (sh as Shift[]).filter((s) => s.date === dayISO);
      setShifts(onlyThatDay);

      if (isManagerLike) {
        setUsers(us as User[]);
        if (formEmployee === "" && (us as User[]).length) {
          setFormEmployee((us as User[])[0].id);
        }
      }
    } catch (e: any) {
      setError(e?.message || "Не удалось загрузить смены");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setEditingOriginalEmployee(null);
    setFormStart("09:00");
    setFormEnd("18:00");
    setFormComment("");
    // formEmployee не трогаем — пусть остаётся выбранным в селекте
  };

  useEffect(() => {
    if (isOpen) {
      load();
      resetForm();
    } else {
      // при закрытии чистим ошибку и busy
      setError("");
      setBusyId(null);
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, dayISO]);

  if (!isOpen || !date) return null;

  const startEdit = (s: Shift) => {
    setEditingId(s.id);

    // ✅ ВАЖНО: берём employee_id с бэка
    const empId = (s as any).employee_id ?? (s as any).employee ?? null;

    if (empId) {
      setFormEmployee(Number(empId));
      setEditingOriginalEmployee(Number(empId));
    } else {
      setFormEmployee("");
      setEditingOriginalEmployee(null);
    }

    setFormStart(toHHMM(s.start_time));
    setFormEnd(toHHMM(s.end_time));
    setFormComment(s.comment || "");
  };

  const onSubmit = async () => {
    if (!isManagerLike) return;
    if (!formEmployee) {
      setError("Выбери сотрудника");
      return;
    }

    setError("");
    try {
      setBusyId(-1);

      if (editingId) {
        // ✅ PATCH: отправляем только реально изменённые поля
        const patch: any = {};

        // employee отправляем только если поменяли
        if (editingOriginalEmployee !== Number(formEmployee)) {
          patch.employee = Number(formEmployee);
        }

        if (formStart) patch.start_time = formStart;
        if (formEnd) patch.end_time = formEnd;

        // comment может быть пустым — это нормально
        patch.comment = formComment;

        // date менять НЕ нужно (у тебя редактирование внутри одного дня)
        await updateShift(editingId, patch);
      } else {
        await createShift({
          employee: Number(formEmployee),
          date: dayISO,
          start_time: formStart,
          end_time: formEnd,
          comment: formComment,
        });
      }

      await load();
      resetForm();
    } catch (e: any) {
      setError(e?.message || "Не удалось сохранить смену");
    } finally {
      setBusyId(null);
    }
  };

  const onDelete = async (shiftId: number) => {
    if (!isManagerLike) return;
    const ok = window.confirm("Удалить смену? Это действие необратимо.");
    if (!ok) return;

    try {
      setBusyId(shiftId);
      await deleteShift(shiftId);
      await load();

      if (editingId === shiftId) resetForm();
    } catch (e: any) {
      setError(e?.message || "Не удалось удалить смену");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Activity mode="visible">
      <div
        className="modal-overlay"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) closeModal();
        }}
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 12,
          zIndex: 50,
        }}
      >
        <div
          className={theme ? `modal modal--${theme}` : "modal modal--round"}
          style={{
            width: "min(860px, 96vw)",
            maxHeight: "90vh",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <button
            className="modal__exit"
            onClick={closeModal}
            style={{ position: "absolute", right: 12, top: 12 }}
          >
            ✕
          </button>

          <div className="modal__header text-center" style={{ padding: "24px 16px 12px" }}>
            <span className="modal__day">{date.getDate()}</span>{" "}
            {MONTHS[date.getMonth()]} {date.getFullYear()}
          </div>

          <div
            className="modal__content"
            style={{
              padding: 16,
              overflowY: "auto",
              maxHeight: "calc(90vh - 80px)",
            }}
          >
            {loading ? <p>Загрузка...</p> : null}
            {error ? <p className="error-feedback">{error}</p> : null}

            {/* список смен */}
            {shifts.length === 0 ? (
              <p className="text-muted">Смен пока нет</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {shifts.map((s) => {
                  const rowBusy = busyId === s.id;

                  return (
                    <div
                      key={s.id}
                      style={{
                        borderRadius: 14,
                        padding: 14,
                        border: "1px solid rgba(0,0,0,0.12)",
                      }}
                    >
                      <div style={{ fontWeight: 800, fontSize: 22 }}>
                        {s.employee_name || `Сотрудник #${(s as any).employee_id ?? "?"}`}
                      </div>

                      <div style={{ fontWeight: 700, fontSize: 22 }}>
                        Время:{" "}
                        <span style={{ fontWeight: 400 }}>
                          {toHHMM(s.start_time)} – {toHHMM(s.end_time)}
                        </span>
                      </div>

                      {s.comment ? (
                        <div style={{ fontWeight: 700, fontSize: 22 }}>
                          Комментарий:{" "}
                          <span style={{ fontWeight: 400 }}>{s.comment}</span>
                        </div>
                      ) : null}

                      {isManagerLike ? (
                        <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                          <Button
                            classess="users__button"
                            onClick={() => startEdit(s)}
                            disabled={rowBusy}
                          >
                            Редактировать
                          </Button>

                          <Button
                            classess="users__button users__button--danger"
                            onClick={() => onDelete(s.id)}
                            disabled={rowBusy}
                          >
                            Удалить
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}

            {/* форма */}
            {isManagerLike ? (
              <div style={{ marginTop: 18, paddingTop: 18, borderTop: "1px solid rgba(0,0,0,0.12)" }}>
                <div style={{ fontWeight: 900, fontSize: 20, marginBottom: 10 }}>
                  {editingId ? "Редактирование смены" : "Добавление смены"}
                </div>

                <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Сотрудник</label>
                <select
                  value={formEmployee}
                  onChange={(e) => setFormEmployee(Number(e.target.value))}
                  style={{
                    width: "100%",
                    borderRadius: 12,
                    padding: 12,
                    border: "1px solid rgba(0,0,0,0.25)",
                    marginBottom: 12,
                  }}
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {userLabel(u)} ({u.role})
                    </option>
                  ))}
                </select>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 140 }}>
                    <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Старт</label>
                    <input
                      type="time"
                      value={formStart}
                      onChange={(e) => setFormStart(e.target.value)}
                      style={{ width: "100%", borderRadius: 12, padding: 12, border: "1px solid rgba(0,0,0,0.25)" }}
                    />
                  </div>

                  <div style={{ flex: 1, minWidth: 140 }}>
                    <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Финиш</label>
                    <input
                      type="time"
                      value={formEnd}
                      onChange={(e) => setFormEnd(e.target.value)}
                      style={{ width: "100%", borderRadius: 12, padding: 12, border: "1px solid rgba(0,0,0,0.25)" }}
                    />
                  </div>
                </div>

                <label style={{ display: "block", margin: "12px 0 6px", fontWeight: 700 }}>
                  Комментарий <span style={{ fontWeight: 400, opacity: 0.6 }}>(необязательно)</span>
                </label>
                <input
                  value={formComment}
                  onChange={(e) => setFormComment(e.target.value)}
                  placeholder="..."
                  style={{ width: "100%", borderRadius: 12, padding: 12, border: "1px solid rgba(0,0,0,0.25)" }}
                />

                <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
                  <Button classess="users__button" onClick={onSubmit} disabled={busyId !== null}>
                    {busyId !== null ? "..." : editingId ? "Сохранить" : "+ Добавить смену"}
                  </Button>

                  {editingId ? (
                    <Button classess="users__button" onClick={resetForm} disabled={busyId !== null}>
                      Отмена
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </Activity>
  );
};