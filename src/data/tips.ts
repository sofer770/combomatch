// Timing and eating habits from the method (not pair rules), written in the app's own words.
// `families`: the tip is shown on the result screen when the meal includes one of these families.

export interface Tip { id: string; icon: string; title: string; text: string; families?: string[] }

const FRUITS = ['sour_fruit', 'semi_fruit', 'sweet_fruit'];
const STARCH = ['starch', 'starchy_veg'];
const PROTEIN = ['animal_protein', 'legumes', 'nuts'];

export const TIPS: Tip[] = [
  { id: 'fruit-empty', icon: '🍎', title: 'פירות על קיבה ריקה', families: FRUITS,
    text: 'פירות מתעכלים מהר. אכלו אותם כשהקיבה ריקה, והמתינו כ-30 עד 40 דקות לפני שאוכלים משהו אחר.' },
  { id: 'melons-alone', icon: '🍉', title: 'אבטיח, מלון וענבים לבד', families: ['melons'],
    text: 'אכלו אותם כארוחה בפני עצמה, בלי מזונות נוספים, והמתינו לפני הארוחה הבאה.' },
  { id: 'sweet-sour', icon: '🍋', title: 'מתוק וחמוץ בנפרד', families: FRUITS,
    text: 'השתדלו לא לאכול פרי מתוק ופרי חמוץ באותה ארוחה.' },
  { id: 'starch-break', icon: '⏱️', title: 'הפסקה אחרי ארוחה עמילנית', families: STARCH,
    text: 'אחרי ארוחה עמילנית, תנו לקיבה 2 עד 4 שעות לפני הארוחה הבאה.' },
  { id: 'protein-break', icon: '⏳', title: 'הפסקה ארוכה יותר אחרי חלבון', families: PROTEIN,
    text: 'אחרי ארוחה חלבונית, המתינו 3 עד 5 שעות לפני הארוחה הבאה. לכן נוח לאכול את הארוחה החלבונית בערב.' },
  { id: 'one-kind', icon: '☝️', title: 'סוג אחד בכל ארוחה', families: [...STARCH, ...PROTEIN],
    text: 'בארוחה עמילנית בחרו עמילן אחד, למשל כוסמת או אורז ולא את שניהם. באותו אופן, בארוחה חלבונית בחרו חלבון אחד.' },
  { id: 'separate-meals', icon: '🍽️', title: 'חלבון ועמילן בארוחות נפרדות', families: [...STARCH, ...PROTEIN],
    text: 'אפשר לקבוע, למשל, שארוחת הצהריים עמילנית (סלט גדול עם קינואה, כוסמת או ירקות עמילניים מאודים), וארוחת הערב חלבונית (סלט גדול עם קטניות או חופן אגוזים).' },
  { id: 'no-drinking', icon: '💧', title: 'לא לשתות בזמן האוכל',
    text: 'לפי השיטה, שתייה בזמן הארוחה מדללת את מיצי העיכול. שתו לפני הארוחה או זמן מה אחריה.' },
  { id: 'light-first', icon: '🌅', title: 'מהקל אל הכבד', families: FRUITS,
    text: 'התחילו את היום במזונות קלים לעיכול, כמו פירות, והשאירו את הארוחות המרוכזות, עמילניות או חלבוניות, להמשך היום.' },
  { id: 'before-sleep', icon: '🌙', title: 'לא סמוך לשינה',
    text: 'את הארוחה המרוכזת של היום אכלו לפחות 2 עד 3 שעות לפני השינה, ועדיף אחרי פעילות גופנית.' },
  { id: 'when-hungry', icon: '🧘', title: 'לאכול כשרעבים',
    text: 'אכלו כשאתם רעבים באמת ולא לפי השעון, ושמרו על הפסקות בין הארוחות.' },
];

/** Up to `limit` tips that fit the families in a meal (always ends with a general tip if room is left). */
export function tipsForFamilies(familyIds: string[], limit = 2): Tip[] {
  const set = new Set(familyIds);
  const specific = TIPS.filter((t) => t.families?.some((f) => set.has(f)));
  const general = TIPS.filter((t) => !t.families);
  return [...specific, ...general].slice(0, limit);
}
