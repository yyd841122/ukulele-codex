const PRACTICE_HISTORY_KEY = "ukulele.practiceHistory.v1";
const PRACTICE_HISTORY_LIMIT = 20;

type WebStorageLike = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};

function getStorage(): WebStorageLike | null {
  const maybeGlobal = globalThis as typeof globalThis & { localStorage?: WebStorageLike };
  return maybeGlobal.localStorage ?? null;
}

export async function loadPracticeHistory<TRecord>(): Promise<TRecord[]> {
  const storage = getStorage();
  if (!storage) return [];

  try {
    const raw = storage.getItem(PRACTICE_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(Boolean).slice(0, PRACTICE_HISTORY_LIMIT) : [];
  } catch {
    return [];
  }
}

export async function savePracticeHistory<TRecord>(records: TRecord[]): Promise<boolean> {
  const storage = getStorage();
  if (!storage) return false;

  try {
    storage.setItem(PRACTICE_HISTORY_KEY, JSON.stringify(records.slice(0, PRACTICE_HISTORY_LIMIT)));
    return true;
  } catch {
    return false;
  }
}

export async function clearPracticeHistory(): Promise<boolean> {
  return savePracticeHistory([]);
}

export { PRACTICE_HISTORY_KEY, PRACTICE_HISTORY_LIMIT };
