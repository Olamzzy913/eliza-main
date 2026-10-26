const KEY = "viewed-v1";

export function getViewed(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

export function pushViewed(id: string) {
  try {
    const list = [id, ...getViewed().filter((x) => x !== id)].slice(0, 12);
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}
