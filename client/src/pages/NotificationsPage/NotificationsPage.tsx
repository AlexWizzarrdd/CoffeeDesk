import "./notifications.css";
import { useEffect, useMemo, useState } from "react";
import {
  getNotifications,
  markAllRead,
  markNotificationRead,
  type Notification,
} from "@/services/notifications.service";
import { Button } from "@/ui-kit/Button/Button";

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

  return (
    <div className="page notifications-page">
      <main className="wrapper" style={{ padding: 16 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "center",
          }}
        >
          <h2 style={{ margin: 0 }}>Уведомления</h2>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <label style={{ display: "flex", gap: 8, alignItems: "center", opacity: 0.85 }}>
              <input
                type="checkbox"
                checked={onlyUnread}
                onChange={(e) => setOnlyUnread(e.target.checked)}
              />
              Только непрочитанные
            </label>

            <Button classess="button-sm" onClick={onReadAll} disabled={busyAll || items.length === 0}>
              {busyAll ? "..." : "Прочитать всё"}
            </Button>

            <Button classess="button-sm" onClick={load} disabled={loading}>
              {loading ? "..." : "Обновить"}
            </Button>
          </div>
        </div>

        {error ? <div style={{ marginTop: 12, opacity: 0.9 }}>{error}</div> : null}

        {loading ? (
          <div style={{ marginTop: 14, opacity: 0.7 }}>Загрузка...</div>
        ) : visibleItems.length === 0 ? (
          <div style={{ marginTop: 14, opacity: 0.7 }}>Нет уведомлений</div>
        ) : (
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            {visibleItems.map((n) => (
              <div
                key={n.id}
                style={{
                  borderRadius: 16,
                  padding: 12,
                  border: "1px solid rgba(255,255,255,0.12)",
                  opacity: n.is_read ? 0.75 : 1,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 800 }}>
                      {!n.is_read ? "● " : ""}
                      {n.title}
                    </div>

                    {n.message ? <div style={{ marginTop: 6 }}>{n.message}</div> : null}

                    <div style={{ marginTop: 8, fontSize: 12, opacity: 0.75 }}>
                      {formatDT(n.created_at)}
                    </div>
                  </div>

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
      </main>
    </div>
  );
};