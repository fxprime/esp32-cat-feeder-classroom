import { LESSONS } from "./lessons.js";

export const STORAGE_KEY = "esp32-lab-progress-v3";
export const PREVIOUS_STORAGE_KEY = "esp32-lab-progress-v2";
export const LEGACY_STORAGE_KEY = "esp32-lab-progress-v1";

export function normalizeProgress(value, legacy = false, previous = false) {
  if (!Array.isArray(value)) return [];
  const maxId = legacy ? 9 : previous ? 10 : Infinity;
  const valid = value.filter((id) =>
    id <= maxId && LESSONS.some((lesson) => lesson.id === id),
  );
  // The previous lesson 6 covered both signals and the PWM comparison.
  return [...new Set(valid.flatMap((id) => legacy
    ? id === 6 ? [6, 7] : [id > 6 ? id + 1 : id]
    : [id]))];
}

export function readProgress(storage) {
  const saved = storage.getItem(STORAGE_KEY);
  if (saved !== null) return normalizeProgress(JSON.parse(saved));
  const previous = storage.getItem(PREVIOUS_STORAGE_KEY);
  const legacy = storage.getItem(LEGACY_STORAGE_KEY);
  if (previous === null && legacy === null) return [];
  const oldOrder = previous !== null
    ? normalizeProgress(JSON.parse(previous), false, true)
    : normalizeProgress(JSON.parse(legacy), true);
  const migrated = oldOrder.map(id => id === 8 ? 9 : id === 9 ? 8 : id);
  storage.setItem(STORAGE_KEY, JSON.stringify(migrated));
  return migrated;
}
