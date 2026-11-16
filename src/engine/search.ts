import type { Food } from '../domain/types';

const FINALS: Record<string, string> = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' };

/** Normalizes Hebrew text for forgiving search: niqqud, final letters, geresh, double yod/vav, case. */
export function normalizeHe(text: string): string {
  return text
    .toLowerCase()
    .replace(/[֑-ׇ]/g, '') // niqqud and cantillation
    .replace(/[׳'"״`’-]/g, '')
    .replace(/[ךםןףץ]/g, (c) => FINALS[c])
    .replace(/יי/g, 'י')
    .replace(/וו/g, 'ו')
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreTerm(term: string, q: string): number {
  if (!term) return 0;
  if (term === q) return 100;
  if (term.startsWith(q)) return 80;
  if (term.split(' ').some((w) => w.startsWith(q))) return 70;
  if (term.includes(q)) return 50;
  return 0;
}

export function searchFoods(foods: Food[], query: string, limit = 8): Food[] {
  const q = normalizeHe(query);
  if (!q) return [];
  return foods
    .filter((f) => f.active)
    .map((f) => {
      const name = scoreTerm(normalizeHe(f.nameHe), q);
      const alias = Math.max(0, ...f.aliases.map((a) => scoreTerm(normalizeHe(a), q) - 5));
      const en = f.nameEn ? scoreTerm(f.nameEn.toLowerCase(), q) - 20 : 0;
      return { f, score: Math.max(name, alias, en) };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.f.nameHe.localeCompare(b.f.nameHe, 'he'))
    .slice(0, limit)
    .map((x) => x.f);
}
