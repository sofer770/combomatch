import { LEVEL_SEVERITY, type CombinationRule, type Food, type Level } from '../domain/types';
import { buildRuleIndex, evaluateMeal, type CheckResult } from './ruleEngine';

export interface Alternative {
  /** Index in the meal of the food that gets replaced. */
  replaceIndex: number;
  replaced: Food;
  candidate: Food;
  newFoods: Food[];
  newLevel: Level;
  explanation: string;
}

/*
 * Suggests up to `limit` swaps that improve a yellow or red meal.
 * Every suggestion is the result of re-running the full engine on the new meal,
 * so it is checked against ALL the other foods, not only the one it replaces.
 * Only green results are offered, or yellow when the current meal is red.
 * "unknown" is never offered as an improvement.
 */
export function suggestAlternatives(
  foods: Food[],
  current: CheckResult,
  allFoods: Food[],
  rules: CombinationRule[],
  limit = 3,
): Alternative[] {
  if (current.level !== 'yellow' && current.level !== 'red') return [];
  const index = buildRuleIndex(rules);
  const acceptable = (l: Level) => l === 'green' || (l === 'yellow' && current.level === 'red');
  const selected = new Set(foods.map((f) => f.id));
  const candidates = allFoods.filter((f) => f.active && f.familyIds.length > 0 && !selected.has(f.id));

  // Foods involved in the problematic pairs are better targets for replacement.
  const problemCount = foods.map(
    (f) =>
      current.pairs.filter(
        (p) => LEVEL_SEVERITY[p.level] >= LEVEL_SEVERITY.yellow && (p.foodA.id === f.id || p.foodB.id === f.id),
      ).length,
  );

  const scored: (Alternative & { score: number })[] = [];
  foods.forEach((replaced, i) => {
    for (const candidate of candidates) {
      const newFoods = foods.map((f, k) => (k === i ? candidate : f));
      const res = evaluateMeal(newFoods, index, { maxFoods: foods.length, minFoods: foods.length });
      if (!acceptable(res.level)) continue;
      const others = foods
        .filter((_, k) => k !== i)
        .map((f) => f.nameHe)
        .join(' ו');
      scored.push({
        replaceIndex: i,
        replaced,
        candidate,
        newFoods,
        newLevel: res.level,
        explanation:
          res.level === 'green'
            ? `נבדק מול ${others}: כל הזוגות בארוחה החדשה מסווגים כמתאימים לפי הכללים.`
            : `נבדק מול ${others}: הצירוף משתפר, אך נותרת הסתייגות.`,
        score:
          (res.level === 'green' ? 0 : 100) -
          problemCount[i] * 10 +
          (candidate.categoryId === replaced.categoryId ? -3 : 0) +
          (candidate.classificationStatus === 'verified' ? -2 : 0) +
          (res.usesUnverifiedRules ? 4 : 0),
      });
    }
  });

  scored.sort((a, b) => a.score - b.score || a.candidate.nameHe.localeCompare(b.candidate.nameHe, 'he'));

  // Prefer variety: one suggestion per (replaced food, candidate category) before repeating.
  const picked: Alternative[] = [];
  const usedKeys = new Set<string>();
  for (const firstPass of [true, false]) {
    for (const s of scored) {
      if (picked.length >= limit) break;
      if (picked.some((p) => p.candidate.id === s.candidate.id && p.replaceIndex === s.replaceIndex)) continue;
      const key = `${s.replaceIndex}|${s.candidate.categoryId}`;
      if (firstPass && usedKeys.has(key)) continue;
      usedKeys.add(key);
      picked.push({
        replaceIndex: s.replaceIndex,
        replaced: s.replaced,
        candidate: s.candidate,
        newFoods: s.newFoods,
        newLevel: s.newLevel,
        explanation: s.explanation,
      });
    }
  }
  return picked;
}
