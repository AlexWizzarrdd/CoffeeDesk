import { useEffect, useState, type ReactNode } from "react";

import { clearTokens } from "@/api/tokenApi";
import { AuthContext } from "@/contexts/AuthContext";
import { ErrorPage } from "@/pages/ErrorPage/ErrorPage";
import { getUser } from "@/services/user.service";
import type { User } from "@/view-models/user.model";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let isMounted = true;

    setIsLoading(true);

    getUser()
      .then((u) => {
        if (!isMounted) return;
        setUser(u);
        setError("");
      })
      .catch((e) => {
        if (!isMounted) return;

        // Если /me не отдал пользователя (401/403/токен битый/просрочен) —
        // чистим токены и отправляем на страницу авторизации.
        setUser(null);
        setError(e?.message ?? "Unauthorized");
        clearTokens();

        // Редиректим сразу, чтобы не оставаться на ErrorPage.
        window.location.replace("/auth");
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return <ErrorPage error={"Грузим данные..."} />;
  }

  // Если пользователя нет — обычно это значит, что мы уже ушли на /auth.
  if (!user) {
    return <ErrorPage error={error || "Пользователь не найден"} />;
  }

  if (error) {
    return <ErrorPage error={error} />;
  }

  if (!user.is_active) {
    return <ErrorPage error={"Пользователь неактивен"} />;
  }

  if (!user.is_approved) {
    return <ErrorPage error={"Пользователь пока не подтвержден"} />;
  }

  return <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>;
};