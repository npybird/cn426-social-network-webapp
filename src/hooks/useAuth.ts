"use client";
import { useEffect, useState } from "react";
import { me } from "@/lib/api";

export function useAuthGuard() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<{
    id: string;
    email: string;
    username: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) {
      setLoading(false);
      return;
    }
    setToken(t);
    me()
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  return { token, user, loading, setToken, setUser };
}
