// client/src/pages/TasksPage/TasksPage.tsx
import "./tasksPage.css";
import { useEffect, useMemo, useState } from "react";
import { useAuthContext } from "@/hooks/authHooks";
import { ErrorPage } from "@/pages/ErrorPage/ErrorPage";
import { Button } from "@/ui-kit/Button/Button";

import {
  createTask,
  getTasks,
  markTaskDone,
  type CreateTaskPayload,
  type TaskItem,
  type TaskStatus,
  type TaskType,
} from "@/services/tasks.service";
import { getUsers } from "@/services/user.service";
import type { User } from "@/view-models/user.model";

const TYPE_LABEL: Record<TaskType, string> = {
  attestation: "Аттестация",
  training: "Обучение",
  medical: "Медосмотр",
  other: "Другое",
};

const STATUS_LABEL: Record<TaskStatus, string> = {
  open: "Открыта",
  done: "Выполнена",
  cancelled: "Отменена",
};

const toISODate = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export const TasksPage = () => {
  const { user: currentUser } = useAuthContext();
  const isManagerLike = currentUser.role === "manager" || currentUser.role === "admin";

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [busyId, setBusyId] = useState<number | null>(null);

  // фильтры
  const [statusFilter, setStatusFilter] = useState<TaskStatus>("open");
  const [assigneeFilter, setAssigneeFilter] = useState<number | "all">("all");

  // для manager/admin — список пользователей для фильтра и создания задач
  const [users, setUsers] = useState<User[]>([]);
  const usersMap = useMemo(() => {
    const m = new Map<number, User>();
    for (const u of users) m.set(u.id, u);
    return m;
  }, [users]);

  // форма создания (только manager/admin)
  const [createAssignee, setCreateAssignee] = useState<number | "">("");
  const [createTitle, setCreateTitle] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [createType, setCreateType] = useState<TaskType>("attestation");
  const [createDue, setCreateDue] = useState<string>(toISODate(new Date()));

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      if (isManagerLike) {
        const u = await getUsers();
        setUsers(u);
      }

      const params: any = { status: statusFilter };
      if (isManagerLike && assigneeFilter !== "all") {
        params.assignee_id = assigneeFilter;
      }

      const data = await getTasks(params);
      const items: TaskItem[] = Array.isArray(data) ? data : data.results ?? [];
      setTasks(items);
    } catch (e: any) {
      setError(e?.message || "Не удалось загрузить задачи");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, assigneeFilter]);

  const onDone = async (id: number) => {
    try {
      setBusyId(id);
      await markTaskDone(id);
      await load();
    } catch (e: any) {
      setError(e?.message || "Не удалось отметить выполненной");
    } finally {
      setBusyId(null);
    }
  };

  const onCreate = async () => {
    if (!isManagerLike) return;

    if (!createAssignee) {
      setError("Выбери сотрудника");
      return;
    }
    if (!createTitle.trim()) {
      setError("Заполни название задачи");
      return;
    }

    const payload: CreateTaskPayload = {
      assignee: Number(createAssignee),
      title: createTitle.trim(),
      description: createDesc.trim(),
      type: createType,
      due_date: createDue || null,
    };

    try {
      setError("");
      await createTask(payload);

      setCreateTitle("");
      setCreateDesc("");
      setCreateType("attestation");
      setCreateDue(toISODate(new Date()));

      await load();
    } catch (e: any) {
      setError(e?.message || "Не удалось создать задачу");
    }
  };

  if (loading) return <ErrorPage error="Грузим задачи..." />;
  if (error) return <ErrorPage error={error} />;

  return (
    <div className="page tasks-page">
      <main className="wrapper">
        {/* Toolbar */}
        <div className="tasks-toolbar">
          <div className="tasks-toolbar__left">
            <h2 style={{ margin: 0 }}>Задачи</h2>
          </div>

          <div className="tasks-toolbar__right">
            <select
              className="tasks-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TaskStatus)}
            >
              <option value="open">Открытые</option>
              <option value="done">Выполненные</option>
              <option value="cancelled">Отменённые</option>
            </select>

            {isManagerLike ? (
              <select
                className="tasks-filter"
                value={assigneeFilter}
                onChange={(e) =>
                  setAssigneeFilter(e.target.value === "all" ? "all" : Number(e.target.value))
                }
                style={{ minWidth: 220 }}
              >
                <option value="all">Все сотрудники</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.last_name} {u.first_name} {u.surname}
                  </option>
                ))}
              </select>
            ) : null}
          </div>
        </div>

        {/* Создание задачи */}
        {isManagerLike ? (
          <div className="tasks-create">
            <div className="tasks-create__title">Создать задачу</div>

            <div className="tasks-create-grid">
              <select
                className="tasks-filter"
                value={createAssignee}
                onChange={(e) => setCreateAssignee(e.target.value ? Number(e.target.value) : "")}
              >
                <option value="">Выбери сотрудника</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.last_name} {u.first_name} {u.surname}
                  </option>
                ))}
              </select>

              <select
                className="tasks-filter"
                value={createType}
                onChange={(e) => setCreateType(e.target.value as TaskType)}
              >
                <option value="attestation">Аттестация</option>
                <option value="training">Обучение</option>
                <option value="medical">Медосмотр</option>
                <option value="other">Другое</option>
              </select>

              <input
                className="tasks-filter"
                type="date"
                value={createDue}
                onChange={(e) => setCreateDue(e.target.value)}
              />

              <Button classess="users__button" onClick={onCreate}>
                Создать
              </Button>
            </div>

            <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
              <input
                className="tasks-create-input"
                value={createTitle}
                onChange={(e) => setCreateTitle(e.target.value)}
                placeholder="Название задачи"
              />

              <textarea
                className="tasks-create-textarea"
                value={createDesc}
                onChange={(e) => setCreateDesc(e.target.value)}
                placeholder="Описание (необязательно)"
                rows={3}
              />
            </div>
          </div>
        ) : null}

        {/* Список задач: скролл только тут */}
        <div className="tasks-list-scroll">
          <ol className="tasks-list">
            {tasks.length === 0 ? (
              <div className="tasks-empty">Нет задач по фильтру: {STATUS_LABEL[statusFilter]}</div>
            ) : (
              tasks.map((t) => {
                const disabled = busyId === t.id;
                const assigneeUser = usersMap.get(t.assignee);

                return (
                  <li key={t.id} className="task-card">
                    <div className="task-card__body">
                      <div className="task-card__title">{t.title}</div>

                      <div className="task-card__meta">
                        • {TYPE_LABEL[t.type]} • срок: <b>{t.due_date ?? "—"}</b> • статус:{" "}
                        {STATUS_LABEL[t.status]}
                      </div>

                      {isManagerLike ? (
                        <div className="task-card__assignee">
                          Исполнитель:{" "}
                          <b>
                            {assigneeUser
                              ? `${assigneeUser.last_name} ${assigneeUser.first_name} ${assigneeUser.surname}`
                              : `ID ${t.assignee}`}
                          </b>
                        </div>
                      ) : null}

                      {t.description ? <div className="task-card__desc">{t.description}</div> : null}
                    </div>

                    <div className="task-card__actions">
                      {t.status === "open" ? (
                        <Button
                          classess="users__button"
                          onClick={() => onDone(t.id)}
                          disabled={disabled}
                        >
                          {disabled ? "..." : "Выполнено"}
                        </Button>
                      ) : (
                        <Button classess="users__button users__button--approved" disabled>
                          {STATUS_LABEL[t.status]}
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })
            )}
          </ol>
        </div>
      </main>
    </div>
  );
};