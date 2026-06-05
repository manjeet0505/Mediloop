import { useState, useEffect, useCallback } from "react";

// ─── Generic data fetching hook ────────────────────────────────────
export function useApi<T>(
  fetchFn: () => Promise<T>,
  deps: any[] = [],
  autoFetch = true
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result);
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    if (autoFetch) execute();
  }, [execute]);

  return { data, loading, error, refetch: execute };
}

// ─── Server health ping ────────────────────────────────────────────
export function useServerHealth() {
  const [online, setOnline] = useState(false);
  const [checking, setChecking] = useState(true);

  const check = useCallback(async () => {
    setChecking(true);
    try {
      const res = await fetch("http://localhost:8000/health");
      setOnline(res.ok);
    } catch {
      setOnline(false);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, []);

  return { online, checking, recheck: check };
}

// ─── Live counter animation ────────────────────────────────────────
export function useCountUp(target: number, duration = 2000) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);

  return count;
}