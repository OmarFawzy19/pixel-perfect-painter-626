// Favorites and recently viewed, stored locally in the browser.
import { useCallback, useEffect, useState } from "react";

const FAV = "cinematch:favorites";
const RECENT = "cinematch:recent";
const EVT = "cinematch:library";

function read(key: string): number[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(key) ?? "[]");
  } catch {
    return [];
  }
}
function write(key: string, v: number[]) {
  localStorage.setItem(key, JSON.stringify(v));
  window.dispatchEvent(new Event(EVT));
}

function useList(key: string) {
  const [list, setList] = useState<number[]>([]);
  useEffect(() => {
    const sync = () => setList(read(key));
    sync();
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [key]);
  return list;
}

export function useFavorites() {
  const favorites = useList(FAV);
  const toggle = useCallback((id: number) => {
    const cur = read(FAV);
    const added = !cur.includes(id);
    write(FAV, added ? [id, ...cur] : cur.filter((x) => x !== id));
    return added;
  }, []);
  return { favorites, toggle, has: (id: number) => favorites.includes(id) };
}

export function useRecent() {
  return useList(RECENT);
}
export function pushRecent(id: number) {
  write(RECENT, [id, ...read(RECENT).filter((x) => x !== id)].slice(0, 12));
}
