// Shared link points to the preview page on the main site (Facebook's crawler is blocked on GitHub Pages); it redirects to the app.
export const APP_URL = 'https://el-habriut.co.il/combo/';
export const SHARE_TEXT = 'ComboMatch - שילובי וצירופי מזון. בודקים צירוף. אוכלים בראש שקט. בוחרים מזונות ומקבלים מיד אם הם משתלבים, לפי שיטת צירופי המזון. חינם, בלי הרשמה.';
const PHONE_INTL = '972542135831';

/** Opens the phone's share sheet; falls back to WhatsApp where sharing is not supported. */
export async function shareApp(): Promise<'shared' | 'whatsapp'> {
  const data = { title: 'ComboMatch', text: SHARE_TEXT, url: APP_URL };
  if (navigator.share) {
    try { await navigator.share(data); return 'shared'; } catch (e) {
      if ((e as Error).name === 'AbortError') return 'shared';
    }
  }
  window.open(`https://wa.me/?text=${encodeURIComponent(`${SHARE_TEXT}\n${APP_URL}`)}`, '_blank', 'noopener');
  return 'whatsapp';
}

/** WhatsApp message to the app owner about a missing food. */
export const missingFoodLink = (name = '') =>
  `https://wa.me/${PHONE_INTL}?text=${encodeURIComponent(`שלום, חסר באפליקציית ComboMatch המזון: ${name}`)}`;
