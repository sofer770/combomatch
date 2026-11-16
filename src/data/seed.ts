import type { Food, FoodCategory, FoodFamily } from '../domain/types';
import matrix from './method-matrix.json';

/*
 * Seed data, based on the practitioner's method document "מהי שיטת צירופי המזון".
 *
 * - Families and rules come from method-matrix.json (the matrix drafted from that document).
 * - Foods named explicitly in the document are "verified"; any other food is an initial
 *   proposal marked "unverified" and can be re-classified from the Foods screen.
 */

export const SEED_CATEGORIES: FoodCategory[] = [
  { id: 'cat_sweet_fruit', name: 'פירות מתוקים', icon: '🍌', order: 1 },
  { id: 'cat_semi_fruit', name: 'פירות חמצמצים', icon: '🍑', order: 2 },
  { id: 'cat_sour_fruit', name: 'פירות חמוצים', icon: '🍊', order: 3 },
  { id: 'cat_melons', name: 'מלונים וענבים', icon: '🍉', order: 4 },
  { id: 'cat_veg', name: 'ירקות', icon: '🥦', order: 5 },
  { id: 'cat_starch', name: 'עמילנים', icon: '🥔', order: 6 },
  { id: 'cat_protein', name: 'חלבונים', icon: '🐟', order: 7 },
  { id: 'cat_fat', name: 'שומנים', icon: '🫒', order: 8 },
  { id: 'cat_legume', name: 'קטניות', icon: '🫘', order: 9 },
  { id: 'cat_nuts', name: 'אגוזים וזרעים', icon: '🌰', order: 10 },
];

const FAMILY_ICONS: Record<string, string> = {
  starch: '🍚', starchy_veg: '🥕', animal_protein: '🐟', legumes: '🫘', nuts: '🌰', fats: '🫒',
  green_veg: '🥦', lettuce_celery: '🥬', neutral_veg: '🫑', tomato: '🍅', sour_fruit: '🍋', semi_fruit: '🍑', sweet_fruit: '🍌', melons: '🍉',
};

export const SEED_FAMILIES: FoodFamily[] = matrix.families.map((f, i) => ({
  id: f.id,
  name: f.name,
  description: f.examples,
  icon: FAMILY_ICONS[f.id] ?? '🍽️',
  order: i + 1,
  builtIn: true,
}));

type SeedFood = Omit<Food, 'active' | 'classificationStatus' | 'custom'> & { verified: boolean };

const F = (
  id: string, nameHe: string, nameEn: string, categoryId: string, familyIds: string[], icon: string,
  aliases: string[] = [], verified = false, classificationNote?: string,
): SeedFood => ({ id, nameHe, nameEn, categoryId, familyIds, icon, aliases, verified, classificationNote });


const foods: SeedFood[] = [
  // Starches (document: rice, quinoa, buckwheat, potato, sweet potato, flour products)
  F('potato', 'תפוח אדמה', 'Potato', 'cat_starch', ['starch'], '🥔', ['תפוחי אדמה', 'תפא', 'פירה', 'צ׳יפס'], true),
  F('sweet_potato', 'בטטה', 'Sweet potato', 'cat_starch', ['starch'], '🍠', ['בטטות'], true),
  F('rice', 'אורז', 'Rice', 'cat_starch', ['starch'], '🍚', ['אורז מלא', 'אורז לבן'], true),
  F('quinoa', 'קינואה', 'Quinoa', 'cat_starch', ['starch'], '🌾', ['קינאווה'], true),
  F('buckwheat', 'כוסמת', 'Buckwheat', 'cat_starch', ['starch'], '🌾', [], true),
  F('bread', 'לחם', 'Bread', 'cat_starch', ['starch'], '🍞', ['לחם מלא', 'פיתה', 'לחמניה'], true),
  F('pasta', 'פסטה', 'Pasta', 'cat_starch', ['starch'], '🍝', ['ספגטי', 'אטריות'], true),
  F('cake', 'עוגה', 'Cake', 'cat_starch', ['starch'], '🍰', ['עוגות', 'עוגיות', 'עוגיה'], true),
  F('oats', 'שיבולת שועל', 'Oats', 'cat_starch', ['starch'], '🥣', ['קוואקר', 'שבולת שועל'], true, 'הסיווג אושר ע״י בעל שיטת הבריאות הטבעית (16.11.2026).'),
  F('corn', 'תירס', 'Corn', 'cat_starch', ['starch'], '🌽', [], true, 'הסיווג אושר ע״י בעל שיטת הבריאות הטבעית (16.11.2026).'),

  // Starchy vegetables (document: carrot, beet, pumpkin)
  F('carrot', 'גזר', 'Carrot', 'cat_veg', ['starchy_veg'], '🥕', ['גזרים'], true),
  F('beet', 'סלק', 'Beet', 'cat_veg', ['starchy_veg'], '🟣', ['סלקים'], true),
  F('pumpkin', 'דלעת', 'Pumpkin', 'cat_veg', ['starchy_veg'], '🎃', ['דלורית'], true),

  // Animal protein (document: meat, chicken, fish, dairy)
  F('beef', 'בשר בקר', 'Beef', 'cat_protein', ['animal_protein'], '🥩', ['בשר', 'סטייק'], true),
  F('chicken', 'עוף', 'Chicken', 'cat_protein', ['animal_protein'], '🍗', ['חזה עוף', 'פרגית'], true),
  F('fish', 'דג', 'Fish', 'cat_protein', ['animal_protein'], '🐟', ['דגים', 'סלמון', 'טונה'], true),
  F('cheese', 'גבינה', 'Cheese', 'cat_protein', ['animal_protein'], '🧀', ['גבינה לבנה', 'קוטג׳', 'קוטג', 'גבינה צהובה', 'מוצרי חלב'], true),
  F('yogurt', 'יוגורט', 'Yogurt', 'cat_protein', ['animal_protein'], '🥛', ['לבן', 'אשל', 'חלב'], true),
  F('egg', 'ביצה', 'Egg', 'cat_protein', ['animal_protein'], '🥚', ['ביצים', 'חביתה'], true, 'הסיווג אושר ע״י בעל שיטת הבריאות הטבעית (16.11.2026).'),

  // Legumes = plant protein (document: beans, mung, lentils; peas in the positive list)
  F('lentils', 'עדשים', 'Lentils', 'cat_legume', ['legumes'], '🫘', ['עדשה', 'עדשים כתומות', 'עדשים ירוקות'], true),
  F('beans', 'שעועית', 'Beans', 'cat_legume', ['legumes'], '🫘', ['שעועית לבנה', 'שעועית אדומה', 'שעועית שחורה'], true),
  F('mung', 'מש', 'Mung beans', 'cat_legume', ['legumes'], '🫘', ['שעועית מש'], true),
  F('peas', 'אפונה', 'Peas', 'cat_legume', ['legumes'], '🫛', [], true),
  F('chickpeas', 'חומוס', 'Chickpeas', 'cat_legume', ['legumes'], '🫘', ['גרגרי חומוס', 'ממרח חומוס'], true,
    'חומוס נחשב חלבון צמחי (קטנית), לפי הכרעת בעל שיטת הבריאות הטבעית.'),
  F('tofu', 'טופו', 'Tofu', 'cat_legume', ['legumes'], '🧊', ['סויה'], true, 'הסיווג אושר ע״י בעל שיטת הבריאות הטבעית (16.11.2026).'),

  // Nuts (document: protein AND fat, with their own rules)
  F('almonds', 'שקדים', 'Almonds', 'cat_nuts', ['nuts'], '🌰', ['שקד'], true),
  F('walnuts', 'אגוזי מלך', 'Walnuts', 'cat_nuts', ['nuts'], '🌰', ['אגוז מלך', 'אגוזים'], true),
  F('cashew', 'קשיו', 'Cashew', 'cat_nuts', ['nuts'], '🌰', ['אגוזי קשיו'], true),
  F('hazelnut', 'אגוזי לוז', 'Hazelnuts', 'cat_nuts', ['nuts'], '🌰', ['לוז'], true),
  F('sunflower', 'גרעיני חמנייה', 'Sunflower seeds', 'cat_fat', ['fats'], '🌻', ['גרעינים', 'חמניה'], true,
    'גרעיני חמנייה הם זרעים (זרעי שמן), לא אגוזים. מבחינה תזונתית הם שייכים לשומנים הבריאים. לפי הכרעת בעל שיטת הבריאות הטבעית.'),

  // Fats (document: all oils, tahini, avocado)
  F('olive_oil', 'שמן זית', 'Olive oil', 'cat_fat', ['fats'], '🫒', ['שמן', 'שמנים'], true),
  F('tahini', 'טחינה', 'Tahini', 'cat_fat', ['fats'], '🥣', ['טחינה גולמית'], true),
  F('avocado', 'אבוקדו', 'Avocado', 'cat_fat', ['fats'], '🥑', [], true),
  F('coconut_oil', 'שמן קוקוס', 'Coconut oil', 'cat_fat', ['fats'], '🥥', [], true),
  F('olives', 'זיתים', 'Olives', 'cat_fat', ['fats'], '🫒', ['זית'], true, 'הסיווג אושר ע״י בעל שיטת הבריאות הטבעית (16.11.2026).'),

  // Sweet fruits
  F('banana', 'בננה', 'Banana', 'cat_sweet_fruit', ['sweet_fruit'], '🍌', ['בננות'], true),
  F('dates', 'תמרים', 'Dates', 'cat_sweet_fruit', ['sweet_fruit'], '🌴', ['תמר', 'מג׳הול'], true),
  F('raisins', 'צימוקים', 'Raisins', 'cat_sweet_fruit', ['sweet_fruit'], '🍇', ['צימוק', 'פירות יבשים'], true),
  F('persimmon', 'אפרסמון', 'Persimmon', 'cat_sweet_fruit', ['sweet_fruit'], '🟠', [], true),
  F('figs', 'תאנים', 'Figs', 'cat_sweet_fruit', ['sweet_fruit', 'semi_fruit'], '🟣', ['תאנה'], true,
    'המסמך מונה תאנים גם בפירות המתוקים וגם בפירות החמצמצים.'),

  // Semi-sour fruits
  F('papaya', 'פפאיה', 'Papaya', 'cat_semi_fruit', ['semi_fruit'], '🥭', ['פאפאיה'], true),
  F('peach', 'אפרסק', 'Peach', 'cat_semi_fruit', ['semi_fruit'], '🍑', ['אפרסקים', 'נקטרינה'], true),
  F('apricot', 'משמש', 'Apricot', 'cat_semi_fruit', ['semi_fruit'], '🟠', ['משמשים'], true),
  F('plum', 'שזיף', 'Plum', 'cat_semi_fruit', ['semi_fruit'], '🟣', ['שזיפים'], true),
  F('mango', 'מנגו', 'Mango', 'cat_semi_fruit', ['semi_fruit'], '🥭', [], true),
  F('pear', 'אגס', 'Pear', 'cat_semi_fruit', ['semi_fruit'], '🍐', ['אגסים'], true),
  F('cherry', 'דובדבן', 'Cherry', 'cat_semi_fruit', ['semi_fruit'], '🍒', ['דובדבנים'], true),
  F('raspberry', 'פטל', 'Raspberry', 'cat_semi_fruit', ['semi_fruit'], '🔴', [], true),
  F('blueberry', 'אוכמניות', 'Blueberries', 'cat_semi_fruit', ['semi_fruit'], '🫐', ['אוכמנית'], true),
  F('apple', 'תפוח', 'Apple', 'cat_semi_fruit', ['semi_fruit'], '🍎', ['תפוחים', 'תפוח עץ'], true,
    'המסמך מזכיר "תפוח חמוץ" בפירות החמוצים. תפוח רגיל הוא פרי חמצמץ, והסיווג אושר ע״י בעל שיטת הבריאות הטבעית.'),

  // Sour fruits
  F('orange', 'תפוז', 'Orange', 'cat_sour_fruit', ['sour_fruit'], '🍊', ['תפוזים', 'קלמנטינה', 'מנדרינה'], true),
  F('grapefruit', 'אשכולית', 'Grapefruit', 'cat_sour_fruit', ['sour_fruit'], '🍊', ['אשכוליות'], true),
  F('pomegranate', 'רימון', 'Pomegranate', 'cat_sour_fruit', ['sour_fruit'], '🔴', ['רימונים'], true),
  F('lemon', 'לימון', 'Lemon', 'cat_sour_fruit', ['sour_fruit'], '🍋', ['לימונים', 'מיץ לימון'], true),
  F('pineapple', 'אננס', 'Pineapple', 'cat_sour_fruit', ['sour_fruit'], '🍍', [], true),
  F('sour_apple', 'תפוח חמוץ', 'Sour apple', 'cat_sour_fruit', ['sour_fruit'], '🍏', ['גרני סמית', 'תפוח ירוק'], true),
  F('strawberry', 'תותים', 'Strawberries', 'cat_semi_fruit', ['semi_fruit'], '🍓', ['תות', 'תות שדה'], true,
    'תות שדה הוא פרי מתוק-חמצמץ, לא פרי חמוץ. פירות חמוצים מובהקים הם פירות הדר כמו לימון. לפי הכרעת בעל שיטת הבריאות הטבעית.'),

  // Melons & grapes (eaten alone)
  F('watermelon', 'אבטיח', 'Watermelon', 'cat_melons', ['melons'], '🍉', ['אבטיחים'], true),
  F('melon', 'מלון', 'Melon', 'cat_melons', ['melons'], '🍈', ['מלונים'], true),
  F('grapes', 'ענבים', 'Grapes', 'cat_melons', ['melons'], '🍇', ['ענב'], true,
    'המסמך מונה ענבים בפירות המתוקים, אך קובע שענבים, כמו מלון ואבטיח, נאכלים בנפרד.'),

  // Green non-starchy vegetables
  F('lettuce', 'חסה', 'Lettuce', 'cat_veg', ['lettuce_celery'], '🥬', ['עלי חסה', 'סלט ירוק', 'חסה ערבית', 'חסה אייסברג', 'חסה לאליק'], true),
  F('kohlrabi', 'קולורבי', 'Kohlrabi', 'cat_veg', ['green_veg'], '🥬', [], true),
  F('green_beans', 'שעועית ירוקה', 'Green beans', 'cat_veg', ['green_veg'], '🫛', ['שעועית צהובה', 'תרמילי שעועית'], true),
  F('spinach', 'תרד', 'Spinach', 'cat_veg', ['green_veg'], '🥬', ['עלי תרד'], true),
  F('celery', 'כרפס', 'Celery', 'cat_veg', ['lettuce_celery'], '🥬', ['סלרי'], true),
  F('parsley', 'פטרוזיליה', 'Parsley', 'cat_veg', ['green_veg'], '🌿', [], true),
  F('broccoli', 'ברוקולי', 'Broccoli', 'cat_veg', ['green_veg'], '🥦', [], true),
  F('chinese_cabbage', 'כרוב סיני', 'Chinese cabbage', 'cat_veg', ['green_veg'], '🥬', [], true),
  F('brussels', 'כרוב ניצנים', 'Brussels sprouts', 'cat_veg', ['green_veg'], '🥬', [], true),
  F('zucchini', 'קישוא', 'Zucchini', 'cat_veg', ['green_veg'], '🥒', ['קישואים', 'זוקיני'], true),
  F('cucumber', 'מלפפון', 'Cucumber', 'cat_veg', ['green_veg'], '🥒', ['מלפפונים'], true, 'הסיווג אושר ע״י בעל שיטת הבריאות הטבעית (16.11.2026).'),
  F('cabbage', 'כרוב', 'Cabbage', 'cat_veg', ['green_veg'], '🥬', ['כרוב סגול', 'כרוב לבן', 'כרוב אדום', 'כרוב ירוק'], true, 'הסיווג אושר ע״י בעל שיטת הבריאות הטבעית (16.11.2026).'),
  F('cauliflower', 'כרובית', 'Cauliflower', 'cat_veg', ['neutral_veg'], '🥦', [], true, 'ירק ניטרלי (לא עמילני) שאפשר להוסיף לכל ארוחה עמילנית או חלבונית. לפי הכרעת בעל שיטת הבריאות הטבעית.'),
  F('pepper', 'פלפל', 'Bell pepper', 'cat_veg', ['neutral_veg'], '🫑', ['פלפלים', 'גמבה', 'פלפל אדום', 'פלפל צהוב', 'פלפל כתום', 'פלפל ירוק'], true, 'ירק ניטרלי (לא עמילני) שאפשר להוסיף לכל ארוחה עמילנית או חלבונית. לפי הכרעת בעל שיטת הבריאות הטבעית.'),
  F('onion', 'בצל', 'Onion', 'cat_veg', ['neutral_veg'], '🧅', ['בצלים', 'בצל יבש', 'בצל סגול'], true, 'בצל יבש הוא ירק ניטרלי או תבלין, ואפשר להוסיף אותו לכל ארוחה עמילנית או חלבונית. לפי הכרעת בעל שיטת הבריאות הטבעית.'),
  F('green_onion', 'בצל ירוק', 'Green onion', 'cat_veg', ['green_veg'], '🌱', ['בצלצל'], true,
    'רק בצל ירוק נחשב ירק ירוק. בצל יבש שייך לירקות הלבנים. לפי הכרעת בעל שיטת הבריאות הטבעית.'),

  // Tomato (its own case in the document)
  F('coriander', 'כוסברה', 'Coriander', 'cat_veg', ['green_veg'], '🌿', ['כוסבר', 'עשבי תיבול'], true, 'ירק ניטרלי (לא עמילני) לפי רשימת בעל שיטת הבריאות הטבעית: עשיר במים ובסיבים ודל מאוד בעמילן, ומשתלב עם חלבונים וגם עם פחמימות.'),
  F('dill', 'שמיר', 'Dill', 'cat_veg', ['green_veg'], '🌿', ['עשבי תיבול'], true, 'ירק ניטרלי (לא עמילני) לפי רשימת בעל שיטת הבריאות הטבעית: עשיר במים ובסיבים ודל מאוד בעמילן, ומשתלב עם חלבונים וגם עם פחמימות.'),
  F('arugula', 'רוקט', 'Arugula', 'cat_veg', ['green_veg'], '🥬', ['ארוגולה', 'אורוגולה', 'עלי בייבי', 'עלים ירוקים'], true, 'ירק ניטרלי (לא עמילני) לפי רשימת בעל שיטת הבריאות הטבעית: עשיר במים ובסיבים ודל מאוד בעמילן, ומשתלב עם חלבונים וגם עם פחמימות.'),
  F('asparagus', 'אספרגוס', 'Asparagus', 'cat_veg', ['green_veg'], '🌱', [], true, 'ירק ניטרלי (לא עמילני) לפי רשימת בעל שיטת הבריאות הטבעית: עשיר במים ובסיבים ודל מאוד בעמילן, ומשתלב עם חלבונים וגם עם פחמימות.'),
  F('okra', 'במיה', 'Okra', 'cat_veg', ['green_veg'], '🌱', ['במייה'], true, 'ירק ניטרלי (לא עמילני) לפי רשימת בעל שיטת הבריאות הטבעית: עשיר במים ובסיבים ודל מאוד בעמילן, ומשתלב עם חלבונים וגם עם פחמימות.'),
  F('eggplant', 'חציל', 'Eggplant', 'cat_veg', ['neutral_veg'], '🍆', ['חצילים'], true, 'ירק ניטרלי (לא עמילני) לפי רשימת בעל שיטת הבריאות הטבעית: עשיר במים ובסיבים ודל מאוד בעמילן, ומשתלב עם חלבונים וגם עם פחמימות.'),
  F('radish', 'צנון', 'Radish', 'cat_veg', ['neutral_veg'], '🔴', ['צנונית', 'צנוניות'], true, 'ירק ניטרלי (לא עמילני) לפי רשימת בעל שיטת הבריאות הטבעית: עשיר במים ובסיבים ודל מאוד בעמילן, ומשתלב עם חלבונים וגם עם פחמימות.'),
  F('turnip', 'לפת', 'Turnip', 'cat_veg', ['neutral_veg'], '⚪', [], true, 'ירק ניטרלי (לא עמילני) לפי רשימת בעל שיטת הבריאות הטבעית: עשיר במים ובסיבים ודל מאוד בעמילן, ומשתלב עם חלבונים וגם עם פחמימות.'),
  F('mushrooms', 'פטריות', 'Mushrooms', 'cat_veg', ['neutral_veg'], '🍄', ['פטרייה', 'שמפיניון', 'פטריות פורטובלו'], true,
    'בוטנית פטרייה, אך תזונתית ניטרלית לחלוטין. ירק ניטרלי לפי רשימת בעל שיטת הבריאות הטבעית.'),
  F('garlic', 'שום', 'Garlic', 'cat_veg', ['neutral_veg'], '🧄', [], true, 'ירק בסיס ותבלין ניטרלי לפי רשימת בעל שיטת הבריאות הטבעית.'),
  F('leek', 'כרישה', 'Leek', 'cat_veg', ['neutral_veg'], '🌱', ['לוף', 'כרשה'], true, 'ירק בסיס ותבלין ניטרלי לפי רשימת בעל שיטת הבריאות הטבעית.'),
  F('sprouts', 'נבטים', 'Sprouts', 'cat_veg', ['neutral_veg'], '🌱', ['נבט', 'נבטים מעורבים'], true, 'כל הנבטים הם ירק ניטרלי, לפי הכרעת בעל שיטת הבריאות הטבעית: משתלבים עם חלבונים ועם עמילנים, לא עם פירות.'),
  F('alfalfa_sprouts', 'נבטי אלפלפא', 'Alfalfa sprouts', 'cat_veg', ['neutral_veg'], '🌱', ['אלפלפא', 'אספסת'], true, 'כל הנבטים הם ירק ניטרלי, לפי הכרעת בעל שיטת הבריאות הטבעית: משתלבים עם חלבונים ועם עמילנים, לא עם פירות.'),
  F('broccoli_sprouts', 'נבטי ברוקולי', 'Broccoli sprouts', 'cat_veg', ['neutral_veg'], '🌱', [], true, 'כל הנבטים הם ירק ניטרלי, לפי הכרעת בעל שיטת הבריאות הטבעית: משתלבים עם חלבונים ועם עמילנים, לא עם פירות.'),
  F('sunflower_sprouts', 'נבטי חמנייה', 'Sunflower sprouts', 'cat_veg', ['neutral_veg'], '🌱', ['נבטי חמניה'], true, 'כל הנבטים הם ירק ניטרלי, לפי הכרעת בעל שיטת הבריאות הטבעית: משתלבים עם חלבונים ועם עמילנים, לא עם פירות.'),
  F('mung_sprouts', 'נבטי מונג', 'Mung bean sprouts', 'cat_veg', ['neutral_veg'], '🌱', ['מש', 'נבטי שעועית', 'נבטי סויה'], true, 'כל הנבטים הם ירק ניטרלי, לפי הכרעת בעל שיטת הבריאות הטבעית: משתלבים עם חלבונים ועם עמילנים, לא עם פירות.'),
  F('lentil_sprouts', 'נבטי עדשים', 'Lentil sprouts', 'cat_veg', ['neutral_veg'], '🌱', [], true, 'כל הנבטים הם ירק ניטרלי, לפי הכרעת בעל שיטת הבריאות הטבעית: משתלבים עם חלבונים ועם עמילנים, לא עם פירות.'),
  F('chickpea_sprouts', 'נבטי חומוס', 'Chickpea sprouts', 'cat_veg', ['neutral_veg'], '🌱', [], true, 'כל הנבטים הם ירק ניטרלי, לפי הכרעת בעל שיטת הבריאות הטבעית: משתלבים עם חלבונים ועם עמילנים, לא עם פירות.'),
  F('radish_sprouts', 'נבטי צנונית', 'Radish sprouts', 'cat_veg', ['neutral_veg'], '🌱', [], true, 'כל הנבטים הם ירק ניטרלי, לפי הכרעת בעל שיטת הבריאות הטבעית: משתלבים עם חלבונים ועם עמילנים, לא עם פירות.'),
  F('tomato', 'עגבנייה', 'Tomato', 'cat_veg', ['tomato'], '🍅', ['עגבניה', 'עגבניות', 'עגבניות שרי'], true),
];

export const SEED_FOODS: Food[] = foods.map(({ verified, ...f }) => ({
  ...f,
  active: true,
  classificationStatus: verified ? 'verified' : 'unverified',
  custom: false,
}));
