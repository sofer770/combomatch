import { describe, expect, it } from 'vitest';
import type { CombinationRule, Food } from '../domain/types';
import { SEED_FOODS } from '../data/seed';
import { METHOD_RULES } from '../data/methodRules';
import { CheckError, evaluateMeal, buildRuleIndex, toAppliedRecords } from '../engine/ruleEngine';
import { suggestAlternatives } from '../engine/alternatives';
import { normalizeHe, searchFoods } from '../engine/search';

const food = (id: string): Food => {
  const f = SEED_FOODS.find((x) => x.id === id);
  if (!f) throw new Error(`missing seed food ${id}`);
  return f;
};

// Fixture rules (independent of the method data) to test the engine mechanics.
const rule = (a: string, b: string, level: CombinationRule['level'], id = `${a}-${b}`): CombinationRule => ({
  id, familyA: a, familyB: b, level, title: id, explanation: '', suggestion: '', source: 'test',
  verificationStatus: 'verified', updatedAt: '2026-01-01T00:00:00Z',
});
const FIX: CombinationRule[] = [
  rule('starch', 'green_veg', 'green'),
  rule('animal_protein', 'green_veg', 'green'),
  rule('green_veg', 'green_veg', 'green'),
  rule('starch', 'starch', 'yellow'),
  rule('animal_protein', 'starch', 'red'),
  rule('legumes', 'starch', 'red'),
];

describe('rule engine', () => {
  it('1. checks two foods', () => {
    const r = evaluateMeal([food('potato'), food('cucumber')], FIX);
    expect(r.pairs).toHaveLength(1);
    expect(r.level).toBe('green');
  });

  it('2. checks ALL pairs for three foods', () => {
    const r = evaluateMeal([food('potato'), food('cucumber'), food('egg')], FIX);
    expect(r.pairs.map((p) => `${p.foodA.id}+${p.foodB.id}`)).toEqual([
      'potato+cucumber', 'potato+egg', 'cucumber+egg',
    ]);
    // potato+egg is red, so the meal can never be green
    expect(r.level).toBe('red');
  });

  it('3. green rule', () => {
    expect(evaluateMeal([food('egg'), food('broccoli')], FIX).level).toBe('green');
  });

  it('4. yellow rule', () => {
    expect(evaluateMeal([food('potato'), food('rice')], FIX).level).toBe('yellow');
  });

  it('5. red rule (potato + lentils)', () => {
    const r = evaluateMeal([food('potato'), food('lentils')], FIX);
    expect(r.level).toBe('red');
    expect(r.pairs[0].decisive.rule?.level).toBe('red');
  });

  it('6. missing rule is reported as unknown, never guessed', () => {
    const r = evaluateMeal([food('banana'), food('egg')], FIX);
    expect(r.level).toBe('unknown');
    expect(r.missing).toEqual([{ familyA: 'sweet_fruit', familyB: 'animal_protein' }]);
  });

  it('rules are symmetric', () => {
    const idx = buildRuleIndex([rule('green_veg', 'starch', 'green')]);
    expect(evaluateMeal([food('potato'), food('cucumber')], idx).level).toBe('green');
    expect(evaluateMeal([food('cucumber'), food('potato')], idx).level).toBe('green');
  });

  it('severity: red beats unknown, unknown beats yellow', () => {
    // potato+rice yellow, banana+? unknown
    expect(evaluateMeal([food('potato'), food('rice'), food('banana')], FIX).level).toBe('unknown');
    expect(evaluateMeal([food('potato'), food('egg'), food('banana')], FIX).level).toBe('red');
  });

  it('rejects invalid selections', () => {
    expect(() => evaluateMeal([food('potato')], FIX)).toThrow(CheckError);
    expect(() => evaluateMeal([food('potato'), food('potato')], FIX)).toThrow(/פעמיים/);
    expect(() => evaluateMeal([food('potato'), food('egg'), food('rice'), food('lettuce')], FIX, { maxFoods: 3 })).toThrow(/עד 3/);
    expect(() => evaluateMeal(['potato', 'egg', 'rice', 'lettuce', 'fish', 'banana', 'pear'].map(food), FIX)).toThrow(/עד 6/);
    expect(evaluateMeal(['fish', 'broccoli', 'lettuce', 'spinach', 'cucumber', 'parsley'].map(food), METHOD_RULES).level).toBe('green');
    const unclassified: Food = { ...food('potato'), id: 'x', nameHe: 'מזון חדש', familyIds: [] };
    expect(() => evaluateMeal([food('potato'), unclassified], FIX)).toThrow(/לא שויך/);
  });

  it('records applied rules for history', () => {
    const r = evaluateMeal([food('potato'), food('lentils')], FIX);
    const rec = toAppliedRecords(r);
    expect(rec.some((x) => x.level === 'red' && x.ruleId)).toBe(true);
  });
});

describe('method rules (from the practitioner document)', () => {
  it('protein + starch is red', () => {
    expect(evaluateMeal([food('chicken'), food('rice')], METHOD_RULES).level).toBe('red');
  });
  it('potato + lentils is red', () => {
    expect(evaluateMeal([food('potato'), food('lentils')], METHOD_RULES).level).toBe('red');
  });
  it('green vegetables go with protein and with starch', () => {
    expect(evaluateMeal([food('fish'), food('broccoli'), food('lettuce')], METHOD_RULES).level).toBe('green');
    expect(evaluateMeal([food('potato'), food('spinach')], METHOD_RULES).level).toBe('green');
  });
  it('one starch per meal, no two proteins', () => {
    expect(evaluateMeal([food('rice'), food('buckwheat')], METHOD_RULES).level).toBe('red');
    expect(evaluateMeal([food('chicken'), food('beans')], METHOD_RULES).level).toBe('red');
  });
  it('fat with protein is red, fat with starch is green', () => {
    expect(evaluateMeal([food('fish'), food('olive_oil')], METHOD_RULES).level).toBe('red');
    expect(evaluateMeal([food('potato'), food('olive_oil')], METHOD_RULES).level).toBe('green');
  });
  it('sour fruit goes with nuts', () => {
    expect(evaluateMeal([food('orange'), food('almonds')], METHOD_RULES).level).toBe('green');
  });
  it('melons and grapes are always alone', () => {
    expect(evaluateMeal([food('watermelon'), food('banana')], METHOD_RULES).level).toBe('red');
    expect(evaluateMeal([food('grapes'), food('lettuce')], METHOD_RULES).level).toBe('red');
  });
  it('pairs no source covers stay unknown', () => {
    const newFam: Food = { ...food('tomato'), id: 'x', nameHe: 'מזון ממשפחה חדשה', familyIds: ['new_family'] };
    expect(evaluateMeal([food('tomato'), newFam], METHOD_RULES).level).toBe('unknown');
    const tomato2: Food = { ...food('tomato'), id: 'tomato2', nameHe: 'עגבנייה 2' };
    expect(evaluateMeal([food('tomato'), tomato2], METHOD_RULES).level).toBe('green');
  });
  it('practitioner rulings (16.11.2026)', () => {
    const lvl = (...ids: string[]) => evaluateMeal(ids.map(food), METHOD_RULES).level;
    expect(lvl('avocado', 'banana')).toBe('red');
    expect(lvl('olive_oil', 'pear')).toBe('red');
    expect(lvl('avocado', 'lemon')).toBe('green');
    expect(lvl('olive_oil', 'avocado')).toBe('green');
    expect(lvl('tomato', 'avocado')).toBe('green');
    expect(lvl('broccoli', 'orange')).toBe('red');
    expect(lvl('tomato', 'orange')).toBe('red');
    expect(lvl('cheese', 'pear')).toBe('red');
    expect(lvl('rice', 'carrot')).toBe('green');
    expect(lvl('carrot', 'sweet_potato')).toBe('green');
    expect(lvl('carrot', 'pumpkin', 'beet')).toBe('green');
    // neutral vegetables go with any protein or starch meal
    expect(lvl('chicken', 'cauliflower', 'onion')).toBe('green');
    expect(lvl('tofu', 'pepper')).toBe('green');
    expect(lvl('rice', 'cauliflower', 'pepper')).toBe('green');
    expect(lvl('potato', 'onion')).toBe('green');
    expect(METHOD_RULES.find((r) => [r.familyA, r.familyB].sort().join() === 'fats,sweet_fruit')?.explanation).toMatch(/תסוס/);
  });
  it('Shelton-sourced decisions', () => {
    expect(evaluateMeal([food('lettuce'), food('orange')], METHOD_RULES).level).toBe('green');
    expect(evaluateMeal([food('celery'), food('pear'), food('apple')], METHOD_RULES).level).toBe('green');
    expect(evaluateMeal([food('tomato'), food('rice')], METHOD_RULES).level).toBe('red');
    expect(evaluateMeal([food('tomato'), food('fish')], METHOD_RULES).level).toBe('red');
    expect(evaluateMeal([food('carrot'), food('banana')], METHOD_RULES).level).toBe('red');
    expect(evaluateMeal([food('pear'), food('almonds')], METHOD_RULES).level).toBe('green');
    expect(METHOD_RULES.find((r) => [r.familyA, r.familyB].sort().join() === 'starch,tomato')?.source).toMatch(/Shelton/);
  });
  it('seeds no yellow rule (the document has no such level)', () => {
    expect(METHOD_RULES.some((r) => r.level === 'yellow')).toBe(false);
  });
  it('interpretations approved by the practitioner are verified', () => {
    expect(METHOD_RULES.find((r) => r.id === 'm_nuts__nuts')?.verificationStatus).toBe('verified');
  });
});

describe('alternatives', () => {
  it('suggests up to 3 swaps, each verified against the whole meal', () => {
    const foods = [food('potato'), food('lentils')];
    const r = evaluateMeal(foods, METHOD_RULES);
    const alts = suggestAlternatives(foods, r, SEED_FOODS, METHOD_RULES);
    expect(alts.length).toBeGreaterThan(0);
    expect(alts.length).toBeLessThanOrEqual(3);
    for (const a of alts) {
      expect(evaluateMeal(a.newFoods, METHOD_RULES).level).toBe('green');
      expect(foods.map((f) => f.id)).not.toContain(a.candidate.id);
    }
  });

  it('three-food meal alternatives are checked against both other foods', () => {
    const foods = [food('chicken'), food('rice'), food('lettuce')];
    const r = evaluateMeal(foods, METHOD_RULES);
    const alts = suggestAlternatives(foods, r, SEED_FOODS, METHOD_RULES);
    for (const a of alts) expect(evaluateMeal(a.newFoods, METHOD_RULES).level).toBe('green');
  });

  it('offers nothing for a green meal', () => {
    const foods = [food('fish'), food('lettuce')];
    expect(suggestAlternatives(foods, evaluateMeal(foods, METHOD_RULES), SEED_FOODS, METHOD_RULES)).toEqual([]);
  });
});

describe('hebrew search', () => {
  it('normalizes final letters, yod and niqqud', () => {
    expect(normalizeHe('עגבנייה')).toBe(normalizeHe('עגבניה'));
    expect(normalizeHe('שָׁקֵד')).toBe('שקד');
  });
  it('finds by prefix and alias', () => {
    expect(searchFoods(SEED_FOODS, 'תפו')[0].id).toMatch(/potato|apple|orange/);
    expect(searchFoods(SEED_FOODS, 'קוטג').map((f) => f.id)).toContain('cheese');
    expect(searchFoods(SEED_FOODS, 'avocado').map((f) => f.id)).toContain('avocado');
  });
  it('returns nothing for an unknown food', () => {
    expect(searchFoods(SEED_FOODS, 'דוריאן')).toEqual([]);
  });
});
