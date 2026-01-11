import "./tasks-bell.css";
import { useEffect, useState } from "react";
import { NavLink } from "react-router";
import TasksIcon from "@/assets/icons/tasksLogo.svg?react";
import { getOpenTasksCount } from "@/services/tasks.service";

export const TasksBell = (props: { pollMs?: number }) => {
  const pollMs = props.pollMs ?? 3000;
  const [count, setCount] = useState(0);

  const refresh = async () => {
    try {
      const c = await getOpenTasksCount();
      setCount(c);
    } catch {
      // молча
    }
  };

  useEffect(() => {
    refresh();
    const t = window.setInterval(refresh, pollMs);
    return () => window.clearInterval(t);
  }, [pollMs]);

  return (
    <NavLink to="/tasks" className="tasks-link" aria-label="Задачи">
      <TasksIcon className="tasks-link__icon" />
      {count > 0 && (
        <span className="tasks-badge">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </NavLink>
  );
};