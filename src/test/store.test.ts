import { describe, expect, it } from 'vitest';
import { createStore, memoryStorage } from '../storage/store';

describe('store', () => {
  it('8. saves a meal and loads it back after reload', () => {
    const storage = memoryStorage();
    const a = createStore(storage);
    const meal = a.saveMeal('ארוחת בוקר קבועה', ['potato', 'cucumber']);
    const b = createStore(storage); // simulates reopening the app
    expect(b.getState().savedMeals[0].name).toBe('ארוחת בוקר קבועה');
    expect(b.mealFoodIds(meal.id)).toEqual(['potato', 'cucumber']);
  });

  it('9. edits and deletes a meal', () => {
    const s = createStore(memoryStorage());
    const meal = s.saveMeal('צהריים', ['potato', 'cucumber']);
    s.updateMeal(meal.id, { name: 'סלט ערב', foodIds: ['lettuce', 'fish', 'tomato'] });
    expect(s.getState().savedMeals[0].name).toBe('סלט ערב');
    expect(s.mealFoodIds(meal.id)).toEqual(['lettuce', 'fish', 'tomato']);
    s.deleteMeal(meal.id);
    expect(s.getState().savedMeals).toHaveLength(0);
    expect(s.getState().mealItems).toHaveLength(0);
  });

  it('editing a rule bumps the rules version and keeps one rule per pair', () => {
    const s = createStore(memoryStorage());
    const v = s.getState().settings.rulesVersion;
    const base = { familyA: 'fats', familyB: 'fats', explanation: '', suggestion: '', source: 'x', verificationStatus: 'verified' as const };
    s.upsertRule({ ...base, level: 'yellow', title: 't' });
    s.upsertRule({ ...base, level: 'green', title: 't2' });
    const rules = s.getState().rules.filter((r) => r.familyA === 'fats' && r.familyB === 'fats');
    expect(rules).toHaveLength(1);
    expect(rules[0].level).toBe('green');
    expect(s.getState().settings.rulesVersion).toBe(v + 2);
  });

  it('imports rules from JSON and rejects unknown families', () => {
    const s = createStore(memoryStorage());
    const n = s.importRules(JSON.stringify([{ familyA: 'fats', familyB: 'fats', level: 'green', title: 'x' }]), 'merge');
    expect(n).toBe(1);
    expect(() => s.importRules(JSON.stringify([{ familyA: 'nope', familyB: 'fats', level: 'green' }]), 'merge')).toThrow();
  });

  it('imports the matrix draft format (status explicit/inferred/undefined)', () => {
    const s = createStore(memoryStorage());
    const n = s.importRules(JSON.stringify({ rules: [
      { familyA: 'fats', familyB: 'fats', level: 'green', status: 'explicit', explanation: 'x' },
      { familyA: 'tomato', familyB: 'starch', level: 'unknown', status: 'undefined' },
    ] }), 'merge');
    expect(n).toBe(1);
    expect(s.getState().rules.find((r) => r.familyA === 'fats' && r.familyB === 'fats')?.verificationStatus).toBe('verified');
  });

  it('updates unedited method rules from a newer bundled matrix, keeping user edits', () => {
    const st = memoryStorage();
    const a = createStore(st);
    a.upsertRule({ familyA: 'fats', familyB: 'fats', level: 'green', title: 'mine', explanation: '', suggestion: '', source: 'me', verificationStatus: 'verified' });
    const raw = JSON.parse(st.getItem('combomatch:db')!);
    raw.settings.methodVersion = 'old';
    raw.rules = raw.rules.map((r: { id: string; level: string }) => (r.id === 'm_starch__starch' ? { ...r, level: 'green' } : r));
    st.setItem('combomatch:db', JSON.stringify(raw));
    const b = createStore(st);
    expect(b.getState().rules.find((r) => r.id === 'm_starch__starch')?.level).toBe('red');
    expect(b.getState().rules.find((r) => r.familyA === 'fats' && r.familyB === 'fats')?.title).toBe('mine');
  });

  it('survives corrupt storage', () => {
    const st = memoryStorage();
    st.setItem('combomatch:db', '{not json');
    expect(createStore(st).getState().foods.length).toBeGreaterThan(20);
  });
});
