// client/src/pages/NotificationsPage/NotificationsPage.tsx
import "./notifications.css";
import { useEffect, useMemo, useState } from "react";
import {
  getNotifications,
  markAllRead,
  markNotificationRead,
  type Notification,
} from "@/services/notifications.service";
import { Button } from "@/ui-kit/Button/Button";
import { ErrorPage } from "@/pages/ErrorPage/ErrorPage";

const formatDT = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}.${mm}.${yyyy} ${hh}:${mi}`;
};

export const NotificationsPage = () => {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [busyAll, setBusyAll] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const list = await getNotifications();
      setItems(Array.isArray(list) ? list : []);
    } catch (e: any) {
      setError(e?.message || "Не удалось загрузить уведомления");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibleItems = useMemo(() => {
    if (!onlyUnread) return items;
    return items.filter((x) => !x.is_read);
  }, [items, onlyUnread]);

  const onRead = async (id: number) => {
    try {
      setBusyId(id);
      await markNotificationRead(id);
      setItems((prev) => prev.map((x) => (x.id === id ? { ...x, is_read: true } : x)));
    } catch (e: any) {
      setError(e?.message || "Не удалось отметить уведомление прочитанным");
    } finally {
      setBusyId(null);
    }
  };

  const onReadAll = async () => {
    try {
      setBusyAll(true);
      await markAllRead();
      setItems((prev) => prev.map((x) => ({ ...x, is_read: true })));
    } catch (e: any) {
      setError(e?.message || "Не удалось отметить все прочитанными");
    } finally {
      setBusyAll(false);
    }
  };

  if (loading) return <ErrorPage error="Грузим уведомления..." />;
  if (error) return <ErrorPage error={error} />;

  return (
    <div className="page notifications-page">
      <main className="wrapper">
        {/* Toolbar */}
        <div className="notifications-toolbar">
          <div className="notifications-toolbar__left">
            <h2 style={{ margin: 0 }}>Уведомления</h2>
          </div>

          <div className="notifications-toolbar__right">
            <label className="notifications-checkbox">
              <input
                type="checkbox"
                checked={onlyUnread}
                onChange={(e) => setOnlyUnread(e.target.checked)}
              />
              Только непрочитанные
            </label>

            <Button
              classess="button-sm"
              onClick={onReadAll}
              disabled={busyAll || items.length === 0}
            >
              {busyAll ? "..." : "Прочитать всё"}
            </Button>

            <Button classess="button-sm" onClick={load} disabled={loading}>
              {loading ? "..." : "Обновить"}
            </Button>
          </div>
        </div>

        {/* Список: скролл только тут */}
        <div className="notifications-list-scroll">
          {visibleItems.length === 0 ? (
            <div className="notifications-empty">Нет уведомлений</div>
          ) : (
            <div className="notifications-list">
              {visibleItems.map((n) => (
                <div
                  key={n.id}
                  className={`notification-card ${n.is_read ? "is-read" : ""}`}
                >
                  <div className="notification-body">
                    <div className="notification-title">
                      {!n.is_read ? "● " : ""}
                      {n.title}
                    </div>

                    {n.message ? <div className="notification-message">{n.message}</div> : null}

                    <div className="notification-date">{formatDT(n.created_at)}</div>
                  </div>

                  <div className="notification-actions">
                    {!n.is_read ? (
                      <Button
                        classess="button-sm"
                        onClick={() => onRead(n.id)}
                        disabled={busyId === n.id}
                      >
                        {busyId === n.id ? "..." : "Прочитано"}
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};