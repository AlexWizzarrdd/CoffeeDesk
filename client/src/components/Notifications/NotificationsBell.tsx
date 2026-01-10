import "./notifications-bell.css";
import { useEffect, useState } from "react";
import { getUnreadCount } from "@/services/notifications.service";
import { useNavigate } from "react-router";

const BellIcon = (props: { className?: string }) => (
  <svg
    className={props.className}
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2Zm6-6V11a6 6 0 1 0-12 0v5l-2 2v1h16v-1l-2-2Z"
      fill="currentColor"
    />
  </svg>
);

export const NotificationsBell = (props: { pollMs?: number }) => {
  const pollMs = props.pollMs ?? 25000;

  const [count, setCount] = useState(0);
  const navigate = useNavigate();

  const refreshCount = async () => {
    try {
      const c = await getUnreadCount();
      setCount(c);
    } catch {
      // молча
    }
  };

  useEffect(() => {
    refreshCount();
    const t = window.setInterval(refreshCount, pollMs);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollMs]);

  return (
    <button
      type="button"
      onClick={() => navigate("/notifications")}
      className="notif-bell"
      aria-label="Уведомления"
    >
      <BellIcon className="notif-bell__icon" />

      {count > 0 ? (
        <span className="notif-badge">{count > 99 ? "99+" : count}</span>
      ) : null}
    </button>
  );
};