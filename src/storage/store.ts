import type {
  AppSettings,
  CheckSnapshot,
  CombinationRule,
  Food,
  FoodCategory,
  FoodFamily,
  HistoryEntry,
  Id,
  MealItem,
  SavedMeal,
} from '../domain/types';
import { SEED_CATEGORIES, SEED_FAMILIES, SEED_FOODS } from '../data/seed';
import { METHOD_MATRIX_VERSION, METHOD_RULES } from '../data/methodRules';
import { pairKey } from '../engine/ruleEngine';

/*
 * Local persistence layer.
 *
 * All entities are kept as normalized tables (no duplicated data):
 *   foods -> categoryId, familyIds; savedMeals 1..n mealItems -> foodId; rules -> familyA/B.
 * Everything goes through this store, so swapping localStorage for a cloud database later
 * means replacing the StorageLike adapter / this module only.
 */

export const SCHEMA_VERSION = 1;
const STORAGE_KEY = 'combomatch:db';
const HISTORY_LIMIT = 300;

export interface DbState {
  settings: AppSettings;
  categories: FoodCategory[];
  families: FoodFamily[];
  foods: Food[];
  rules: CombinationRule[];
  savedMeals: SavedMeal[];
  mealItems: MealItem[];
  history: HistoryEntry[];
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const nowIso = () => new Date().toISOString();
export const newId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export function createSeedState(): DbState {
  return {
    settings: {
      schemaVersion: SCHEMA_VERSION,
      rulesVersion: 1,
      rulesUpdatedAt: nowIso(),
      demoMode: false,
      maxFoods: 3,
      minFoods: 2,
      saveHistory: true,
      disclaimerAccepted: false,
      methodVersion: METHOD_MATRIX_VERSION,
    },
    categories: structuredClone(SEED_CATEGORIES),
    families: structuredClone(SEED_FAMILIES),
    foods: structuredClone(SEED_FOODS),
    rules: structuredClone(METHOD_RULES),
    savedMeals: [],
    mealItems: [],
    history: [],
  };
}

/**
 * Brings a device's stored rules up to the bundled method matrix:
 * method rules the user never edited are replaced by the new version, rules the user edited
 * (or created) are kept, and new method rules fill pairs that have no rule.
 */
export function mergeMethodRules(stored: CombinationRule[]): CombinationRule[] {
  const unedited = (r: CombinationRule) => r.id.startsWith('m_') && r.updatedAt.endsWith('T00:00:00.000Z');
  const kept = stored.filter((r) => !unedited(r));
  const taken = new Set(kept.map((r) => pairKey(r.familyA, r.familyB)));
  return [...kept, ...structuredClone(METHOD_RULES).filter((r) => !taken.has(pairKey(r.familyA, r.familyB)))];
}

function migrate(raw: unknown): DbState | null {
  if (!raw || typeof raw !== 'object') return null;
  const s = raw as Partial<DbState>;
  if (!s.settings || !Array.isArray(s.foods) || !Array.isArray(s.rules)) return null;
  const seed = createSeedState();
  let rules = s.rules;
  let settings = { ...seed.settings, ...s.settings, schemaVersion: SCHEMA_VERSION, demoMode: false };
  let families = s.families ?? seed.families;
  let foods = s.foods;
  if (s.settings.methodVersion !== METHOD_MATRIX_VERSION) {
    rules = mergeMethodRules(rules);
    // add new bundled families, and refresh the classification of built-in foods the user never edited
    const famIds = new Set(families.map((f) => f.id));
    const seedOrder = new Map(seed.families.map((f) => [f.id, f.order]));
    families = [...families.map((f) => (f.builtIn && seedOrder.has(f.id) ? { ...f, order: seedOrder.get(f.id)! } : f)), ...seed.families.filter((f) => !famIds.has(f.id))];
    const seedFoods = new Map(seed.foods.map((f) => [f.id, f]));
    const have = new Set(foods.map((f) => f.id));
    foods = [
      ...foods.map((f) => {
        const sf = seedFoods.get(f.id);
        return sf && !f.custom && !f.edited
          ? { ...f, categoryId: sf.categoryId, aliases: sf.aliases, familyIds: sf.familyIds, classificationStatus: sf.classificationStatus, classificationNote: sf.classificationNote }
          : f;
      }),
      ...seed.foods.filter((f) => !have.has(f.id)),
    ];
    settings = { ...settings, methodVersion: METHOD_MATRIX_VERSION, rulesVersion: settings.rulesVersion + 1, rulesUpdatedAt: nowIso() };
  }
  return {
    settings,
    categories: s.categories ?? seed.categories,
    families,
    foods,
    rules,
    savedMeals: s.savedMeals ?? [],
    mealItems: s.mealItems ?? [],
    history: s.history ?? [],
  };
}

export function memoryStorage(): StorageLike {
  const m = new Map<string, string>();
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, v),
    removeItem: (k) => void m.delete(k),
  };
}

export function browserStorage(): StorageLike {
  try {
    const ls = window.localStorage;
    const probe = '__combomatch_probe__';
    ls.setItem(probe, '1');
    ls.removeItem(probe);
    return ls;
  } catch {
    return memoryStorage();
  }
}

export type Listener = () => void;

export function createStore(storage: StorageLike) {
  let state: DbState = (() => {
    try {
      const raw = storage.getItem(STORAGE_KEY);
      return (raw && migrate(JSON.parse(raw))) || createSeedState();
    } catch {
      return createSeedState();
    }
  })();
  let persistError: string | null = null;
  const listeners = new Set<Listener>();

  const persist = () => {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(state));
      persistError = null;
    } catch {
      persistError = 'לא ניתן לשמור נתונים במכשיר זה (ייתכן שהאחסון מלא או חסום).';
    }
  };

  const set = (updater: (s: DbState) => DbState) => {
    state = updater(state);
    persist();
    listeners.forEach((l) => l());
  };

  const bumpRules = (s: DbState): AppSettings => ({
    ...s.settings,
    rulesVersion: s.settings.rulesVersion + 1,
    rulesUpdatedAt: nowIso(),
  });

  const api = {
    getState: () => state,
    getPersistError: () => persistError,
    subscribe(l: Listener) {
      listeners.add(l);
      return () => listeners.delete(l);
    },

    /** Rules the engine uses. (Demo rules were removed: the method has no "yellow" level.) */
    effectiveRules(s: DbState = state): CombinationRule[] {
      return s.rules.filter((r) => r.verificationStatus !== 'demo');
    },

    // ---- settings
    updateSettings(patch: Partial<AppSettings>) {
      set((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
    },

    // ---- foods
    addFood(input: Omit<Food, 'id' | 'custom' | 'active'> & { active?: boolean }): Food {
      const food: Food = { active: true, ...input, id: newId('food'), custom: true };
      set((s) => ({ ...s, foods: [...s.foods, food] }));
      return food;
    },
    updateFood(id: Id, patch: Partial<Omit<Food, 'id'>>) {
      set((s) => ({ ...s, foods: s.foods.map((f) => (f.id === id ? { ...f, ...patch, edited: true } : f)) }));
    },
    /** Custom foods are removed; built-in ones are deactivated so history stays readable. */
    removeFood(id: Id) {
      set((s) => {
        const food = s.foods.find((f) => f.id === id);
        if (!food) return s;
        if (!food.custom) return { ...s, foods: s.foods.map((f) => (f.id === id ? { ...f, active: false } : f)) };
        const used = s.mealItems.some((m) => m.foodId === id);
        return used
          ? { ...s, foods: s.foods.map((f) => (f.id === id ? { ...f, active: false } : f)) }
          : { ...s, foods: s.foods.filter((f) => f.id !== id) };
      });
    },

    // ---- families
    addFamily(input: Pick<FoodFamily, 'name' | 'description' | 'icon'>): FoodFamily {
      const fam: FoodFamily = { ...input, id: newId('fam'), builtIn: false, order: state.families.length + 1 };
      set((s) => ({ ...s, families: [...s.families, fam], settings: bumpRules(s) }));
      return fam;
    },
    updateFamily(id: Id, patch: Partial<Pick<FoodFamily, 'name' | 'description' | 'icon'>>) {
      set((s) => ({ ...s, families: s.families.map((f) => (f.id === id ? { ...f, ...patch } : f)) }));
    },
    deleteFamily(id: Id) {
      set((s) => {
        const fam = s.families.find((f) => f.id === id);
        if (!fam || fam.builtIn) return s;
        return {
          ...s,
          families: s.families.filter((f) => f.id !== id),
          foods: s.foods.map((f) => ({ ...f, familyIds: f.familyIds.filter((x) => x !== id) })),
          rules: s.rules.filter((r) => r.familyA !== id && r.familyB !== id),
          settings: bumpRules(s),
        };
      });
    },

    // ---- rules
    upsertRule(input: Omit<CombinationRule, 'id' | 'updatedAt'> & { id?: Id }): CombinationRule {
      const key = pairKey(input.familyA, input.familyB);
      const existing = state.rules.find((r) => r.id === input.id || pairKey(r.familyA, r.familyB) === key);
      const rule: CombinationRule = { ...input, id: existing?.id ?? newId('rule'), updatedAt: nowIso() };
      set((s) => ({
        ...s,
        // one rule per family pair: replace the old one for that pair
        rules: [...s.rules.filter((r) => r.id !== rule.id && pairKey(r.familyA, r.familyB) !== key), rule],
        settings: bumpRules(s),
      }));
      return rule;
    },
    deleteRule(id: Id) {
      set((s) => ({ ...s, rules: s.rules.filter((r) => r.id !== id), settings: bumpRules(s) }));
    },
    /** Imports a JSON rules file. Returns the number of rules imported. */
    importRules(json: string, mode: 'merge' | 'replace'): number {
      const parsed = JSON.parse(json) as unknown;
      const list = Array.isArray(parsed) ? parsed : (parsed as { rules?: unknown }).rules;
      if (!Array.isArray(list)) throw new Error('הקובץ אינו מכיל רשימת כללים');
      const famIds = new Set(state.families.map((f) => f.id));
      const levels = new Set(['green', 'yellow', 'red', 'unknown']);
      // Accepts the app's own export format and the matrix-draft format (status: explicit / inferred / undefined).
      type Incoming = Partial<CombinationRule> & { status?: string };
      const rows = (list as Incoming[]).filter((x) => x.status !== 'undefined');
      const clean: CombinationRule[] = rows.map((x: Incoming, i: number) => {
        if (!x.familyA || !x.familyB || !famIds.has(x.familyA) || !famIds.has(x.familyB)) {
          throw new Error(`כלל ${i + 1}: משפחת מזון לא מוכרת`);
        }
        if (!x.level || !levels.has(x.level)) throw new Error(`כלל ${i + 1}: רמת התאמה לא חוקית`);
        return {
          id: x.id || newId('rule'),
          familyA: x.familyA,
          familyB: x.familyB,
          level: x.level,
          title: x.title ?? (x.explanation ?? '').replace(/\.$/, ''),
          explanation: x.explanation ?? '',
          suggestion: x.suggestion ?? '',
          source: x.source ?? 'ייבוא קובץ',
          verificationStatus: x.verificationStatus === 'verified' || x.status === 'explicit' ? 'verified' : 'unverified',
          updatedAt: x.updatedAt ?? nowIso(),
        };
      });
      set((s) => {
        const base = mode === 'replace' ? [] : s.rules;
        const keys = new Set(clean.map((r) => pairKey(r.familyA, r.familyB)));
        return {
          ...s,
          rules: [...base.filter((r) => !keys.has(pairKey(r.familyA, r.familyB))), ...clean],
          settings: bumpRules(s),
        };
      });
      return clean.length;
    },
    restoreMethodRules() {
      set((s) => ({ ...s, rules: structuredClone(METHOD_RULES), settings: bumpRules(s) }));
    },

    // ---- saved meals
    saveMeal(name: string, foodIds: Id[], lastCheck?: CheckSnapshot): SavedMeal {
      const ts = nowIso();
      const meal: SavedMeal = { id: newId('meal'), name: name.trim(), createdAt: ts, updatedAt: ts, lastCheck };
      const items: MealItem[] = foodIds.map((foodId, position) => ({ id: newId('item'), mealId: meal.id, foodId, position }));
      set((s) => ({ ...s, savedMeals: [meal, ...s.savedMeals], mealItems: [...s.mealItems, ...items] }));
      return meal;
    },
    updateMeal(id: Id, patch: { name?: string; foodIds?: Id[]; lastCheck?: CheckSnapshot }) {
      set((s) => {
        let mealItems = s.mealItems;
        if (patch.foodIds) {
          mealItems = [
            ...s.mealItems.filter((m) => m.mealId !== id),
            ...patch.foodIds.map((foodId, position) => ({ id: newId('item'), mealId: id, foodId, position })),
          ];
        }
        return {
          ...s,
          mealItems,
          savedMeals: s.savedMeals.map((m) =>
            m.id === id
              ? {
                  ...m,
                  name: patch.name?.trim() || m.name,
                  lastCheck: patch.lastCheck ?? m.lastCheck,
                  updatedAt: nowIso(),
                }
              : m,
          ),
        };
      });
    },
    deleteMeal(id: Id) {
      set((s) => ({
        ...s,
        savedMeals: s.savedMeals.filter((m) => m.id !== id),
        mealItems: s.mealItems.filter((m) => m.mealId !== id),
      }));
    },
    mealFoodIds(mealId: Id, s: DbState = state): Id[] {
      return s.mealItems
        .filter((m) => m.mealId === mealId)
        .sort((a, b) => a.position - b.position)
        .map((m) => m.foodId);
    },

    // ---- history
    addHistory(entry: Omit<HistoryEntry, 'id'>) {
      if (!state.settings.saveHistory) return;
      set((s) => ({ ...s, history: [{ ...entry, id: newId('chk') }, ...s.history].slice(0, HISTORY_LIMIT) }));
    },
    deleteHistory(id: Id) {
      set((s) => ({ ...s, history: s.history.filter((h) => h.id !== id) }));
    },
    clearHistory() {
      set((s) => ({ ...s, history: [] }));
    },

    // ---- backup
    exportAll(): string {
      return JSON.stringify({ app: 'ComboMatch', exportedAt: nowIso(), ...state }, null, 2);
    },
    exportRules(): string {
      return JSON.stringify(
        { app: 'ComboMatch', rulesVersion: state.settings.rulesVersion, families: state.families, rules: state.rules },
        null,
        2,
      );
    },
    resetAll() {
      set(() => createSeedState());
    },
  };
  return api;
}

export type Store = ReturnType<typeof createStore>;
