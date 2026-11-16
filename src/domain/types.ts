// Core domain model for ComboMatch.
// Entities mirror the spec: Foods, FoodCategories, FoodFamilies, CombinationRules,
// SavedMeals, MealItems, SearchHistory (check history) and AppSettings.

export type Id = string;

/** Result level of a rule or of a whole check. */
export type Level = 'green' | 'yellow' | 'red' | 'unknown';

/** How trustworthy a rule or a classification is. */
export type VerificationStatus =
  | 'verified' // confirmed by the practitioner / authoritative source
  | 'unverified' // entered, but not yet confirmed
  | 'demo'; // sample data for UI demonstration only, never a rule of the method

/** Navigation category (UI only, never used for decisions). */
export interface FoodCategory {
  id: Id;
  name: string;
  icon: string;
  order: number;
}

/** Nutritional family used by the rule engine. */
export interface FoodFamily {
  id: Id;
  name: string;
  description: string;
  icon: string;
  order: number;
  /** User-created families can be deleted; seeded ones are kept. */
  builtIn: boolean;
}

export interface Food {
  id: Id;
  nameHe: string;
  nameEn?: string;
  categoryId: Id;
  /** One or more families. Empty = not classified, cannot be checked. */
  familyIds: Id[];
  /** Alternative search terms (spellings, plurals, slang). */
  aliases: string[];
  icon: string;
  active: boolean;
  /** Whether the family assignment was confirmed by the practitioner. */
  classificationStatus: VerificationStatus;
  /** Free note about the classification (e.g. "some approaches treat it as..."). */
  classificationNote?: string;
  custom: boolean;
  /** Set once the user edits a built-in food, so bundled updates no longer overwrite it. */
  edited?: boolean;
}

/** A rule for one pair of families (symmetric: A+B == B+A). */
export interface CombinationRule {
  id: Id;
  familyA: Id;
  familyB: Id;
  level: Level;
  title: string;
  explanation: string;
  suggestion: string;
  source: string;
  verificationStatus: VerificationStatus;
  updatedAt: string; // ISO
}

export interface SavedMeal {
  id: Id;
  name: string;
  createdAt: string;
  updatedAt: string;
  lastCheck?: CheckSnapshot;
}

export interface MealItem {
  id: Id;
  mealId: Id;
  foodId: Id;
  position: number;
}

/** Minimal, self-contained record of how a decision was made. */
export interface CheckSnapshot {
  level: Level;
  checkedAt: string;
  rulesVersion: number;
  demoMode: boolean;
}

/** A pair-level rule application, stored so past decisions stay explainable. */
export interface AppliedRuleRecord {
  ruleId: Id | null;
  foodA: Id;
  foodB: Id;
  familyA: Id;
  familyB: Id;
  level: Level;
  title: string;
  verificationStatus: VerificationStatus | null;
}

export interface HistoryEntry {
  id: Id;
  checkedAt: string;
  foodIds: Id[];
  /** Food names at check time, in case a food is later renamed or removed. */
  foodNames: string[];
  level: Level;
  summary: string;
  rulesVersion: number;
  demoMode: boolean;
  appliedRules: AppliedRuleRecord[];
}

export interface AppSettings {
  schemaVersion: number;
  rulesVersion: number;
  rulesUpdatedAt: string;
  demoMode: boolean;
  maxFoods: number;
  minFoods: number;
  saveHistory: boolean;
  disclaimerAccepted: boolean;
  /** Version of the bundled method matrix last merged into this device's rules. */
  methodVersion?: string;
}

export const LEVEL_SEVERITY: Record<Level, number> = {
  green: 0,
  yellow: 1,
  unknown: 2,
  red: 3,
};
