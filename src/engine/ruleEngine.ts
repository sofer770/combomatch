import {
  LEVEL_SEVERITY,
  type AppliedRuleRecord,
  type CombinationRule,
  type Food,
  type FoodFamily,
  type Id,
  type Level,
} from '../domain/types';

/*
 * ComboMatch rule engine.
 *
 * Deterministic, data-driven, no AI:
 *  1. every selected food is mapped to its families;
 *  2. EVERY pair of foods is checked (for 3 foods: A-B, A-C, B-C);
 *  3. for a pair, every family combination is looked up in the rule matrix (rules are symmetric);
 *  4. conflicts are resolved by severity: red > unknown > yellow > green.
 *     - any red makes the whole meal red;
 *     - a missing rule is never guessed: it makes the meal "unknown" unless something is already red;
 *     - yellow only if everything else is green.
 */

export const SEVERITY_ORDER_TEXT = 'אדום > לא מוגדר > צהוב > ירוק';

export interface FamilyCheck {
  familyA: Id;
  familyB: Id;
  rule: CombinationRule | null;
  level: Level;
}

export interface PairResult {
  foodA: Food;
  foodB: Food;
  level: Level;
  checks: FamilyCheck[];
  /** The check that decided the pair's level (most severe). */
  decisive: FamilyCheck;
}

export interface CheckResult {
  level: Level;
  pairs: PairResult[];
  /** Distinct rules that took part in the decision. */
  rulesUsed: CombinationRule[];
  /** Family pairs with no rule in the matrix. */
  missing: { familyA: Id; familyB: Id }[];
  usesDemoRules: boolean;
  usesUnverifiedRules: boolean;
}

export class CheckError extends Error {
  constructor(
    message: string,
    public readonly code: 'too_few' | 'too_many' | 'duplicate' | 'unclassified',
    public readonly foods: Food[] = [],
  ) {
    super(message);
  }
}

export const pairKey = (a: Id, b: Id) => (a < b ? `${a}|${b}` : `${b}|${a}`);

export type RuleIndex = Map<string, CombinationRule>;

/** Builds a symmetric lookup. If two rules exist for the same pair, the most recently updated wins. */
export function buildRuleIndex(rules: CombinationRule[]): RuleIndex {
  const index: RuleIndex = new Map();
  for (const rule of rules) {
    const key = pairKey(rule.familyA, rule.familyB);
    const existing = index.get(key);
    if (!existing || existing.updatedAt <= rule.updatedAt) index.set(key, rule);
  }
  return index;
}

export function worstLevel(levels: Level[]): Level {
  return levels.reduce<Level>((worst, l) => (LEVEL_SEVERITY[l] > LEVEL_SEVERITY[worst] ? l : worst), 'green');
}

export function checkFamilies(a: Id, b: Id, index: RuleIndex): FamilyCheck {
  const rule = index.get(pairKey(a, b)) ?? null;
  return { familyA: a, familyB: b, rule, level: rule ? rule.level : 'unknown' };
}

export function checkPair(foodA: Food, foodB: Food, index: RuleIndex): PairResult {
  const checks: FamilyCheck[] = [];
  const seen = new Set<string>();
  for (const fa of foodA.familyIds) {
    for (const fb of foodB.familyIds) {
      const key = pairKey(fa, fb);
      if (seen.has(key)) continue;
      seen.add(key);
      checks.push(checkFamilies(fa, fb, index));
    }
  }
  const decisive = checks.reduce((w, c) => (LEVEL_SEVERITY[c.level] > LEVEL_SEVERITY[w.level] ? c : w), checks[0]);
  return { foodA, foodB, level: decisive.level, checks, decisive };
}

export interface CheckOptions {
  minFoods?: number;
  maxFoods?: number;
}

export function validateSelection(foods: Food[], { minFoods = 2, maxFoods = 6 }: CheckOptions = {}) {
  if (foods.length < minFoods) throw new CheckError(`יש לבחור לפחות ${minFoods} מזונות`, 'too_few');
  if (foods.length > maxFoods) throw new CheckError(`ניתן לבחור עד ${maxFoods} מזונות`, 'too_many');
  const ids = new Set(foods.map((f) => f.id));
  if (ids.size !== foods.length) throw new CheckError('אותו מזון נבחר פעמיים', 'duplicate');
  const unclassified = foods.filter((f) => f.familyIds.length === 0);
  if (unclassified.length) {
    throw new CheckError(
      `לא ניתן לבדוק: ${unclassified.map((f) => f.nameHe).join(', ')} עדיין לא שויך למשפחת מזון`,
      'unclassified',
      unclassified,
    );
  }
}

export function evaluateMeal(foods: Food[], rules: CombinationRule[] | RuleIndex, options?: CheckOptions): CheckResult {
  validateSelection(foods, options);
  const index = rules instanceof Map ? rules : buildRuleIndex(rules);

  const pairs: PairResult[] = [];
  for (let i = 0; i < foods.length; i++) {
    for (let j = i + 1; j < foods.length; j++) pairs.push(checkPair(foods[i], foods[j], index));
  }

  const rulesUsed = new Map<Id, CombinationRule>();
  const missing = new Map<string, { familyA: Id; familyB: Id }>();
  for (const p of pairs) {
    for (const c of p.checks) {
      if (c.rule) rulesUsed.set(c.rule.id, c.rule);
      else missing.set(pairKey(c.familyA, c.familyB), { familyA: c.familyA, familyB: c.familyB });
    }
  }
  const used = [...rulesUsed.values()];
  return {
    level: worstLevel(pairs.map((p) => p.level)),
    pairs,
    rulesUsed: used,
    missing: [...missing.values()],
    usesDemoRules: used.some((r) => r.verificationStatus === 'demo'),
    usesUnverifiedRules: used.some((r) => r.verificationStatus === 'unverified'),
  };
}

/** Records every family check so a past decision can be explained later. */
export function toAppliedRecords(result: CheckResult): AppliedRuleRecord[] {
  return result.pairs.flatMap((p) =>
    p.checks.map((c) => ({
      ruleId: c.rule?.id ?? null,
      foodA: p.foodA.id,
      foodB: p.foodB.id,
      familyA: c.familyA,
      familyB: c.familyB,
      level: c.level,
      title: c.rule?.title ?? 'טרם הוגדר',
      verificationStatus: c.rule?.verificationStatus ?? null,
    })),
  );
}

export const LEVEL_TEXT: Record<Level, { title: string; short: string }> = {
  green: { title: 'צירוף מתאים', short: 'מתאים' },
  yellow: { title: 'צירוף עם הסתייגות', short: 'בהסתייגות' },
  red: { title: 'צירוף שאינו מומלץ', short: 'לא מומלץ' },
  unknown: { title: 'הצירוף טרם הוגדר', short: 'טרם הוגדר' },
};

export function familyName(families: FoodFamily[], id: Id) {
  return families.find((f) => f.id === id)?.name ?? id;
}

/** One-line human summary of a result, used in history and saved meals. */
export function summarize(result: CheckResult, families: FoodFamily[]): string {
  const bad = result.pairs.filter((p) => p.level === result.level);
  if (result.level === 'green') return 'על פי כללי השיטה שהוגדרו באפליקציה, כל הזוגות בארוחה מתאימים.';
  const parts = bad.map((p) => {
    const c = p.decisive;
    const fam = `${familyName(families, c.familyA)} + ${familyName(families, c.familyB)}`;
    return `${p.foodA.nameHe} + ${p.foodB.nameHe} (${fam})`;
  });
  if (result.level === 'unknown') return `אין כלל מוגדר עבור: ${parts.join('; ')}.`;
  if (result.level === 'yellow') return `הסתייגות לפי הכללים: ${parts.join('; ')}.`;
  return `על פי כללי השיטה שהוגדרו באפליקציה, השילוב אינו מומלץ: ${parts.join('; ')}.`;
}
