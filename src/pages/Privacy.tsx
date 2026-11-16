import { Link } from 'react-router-dom';
import { PageTitle } from '../components/ui';

const UPDATED = '16 בנובמבר 2026';

export default function Privacy() {
  return (
    <article className="mx-auto max-w-2xl">
      <PageTitle title="מדיניות פרטיות" subtitle={`עודכנה לאחרונה: ${UPDATED}`} />
      <div className="card space-y-4 p-5 leading-7 text-ink/90 sm:p-6">
        <p>הפרטיות שלכם חשובה לנו. בקצרה: האפליקציה לא אוספת עליכם מידע אישי.</p>
        <h2 className="text-lg font-semibold text-leaf-dark">אין הרשמה ואין מידע אישי</h2>
        <p>אין צורך להירשם, ואיננו מבקשים שם, טלפון, מייל או כל פרט מזהה.</p>
        <h2 className="text-lg font-semibold text-leaf-dark">הנתונים שלכם נשארים אצלכם</h2>
        <p>
          הארוחות ששמרתם, היסטוריית הבדיקות, מזונות שהוספתם והגדרות האפליקציה נשמרים רק בזיכרון של המכשיר שלכם, ולא נשלחים
          אלינו או לאף גורם אחר. אפשר למחוק את כולם בכל רגע דרך ההגדרות ("איפוס כל הנתונים").
        </p>
        <h2 className="text-lg font-semibold text-leaf-dark">ספירת שימוש אנונימית</h2>
        <p>
          כדי לדעת כמה אנשים משתמשים באפליקציה, אנו סופרים כניסות והתקנות באמצעות השירות GoatCounter. הספירה אנונימית: בלי
          עוגיות (cookies), בלי מעקב בין אתרים ובלי שמירת פרטים מזהים. לא נשלח מידע על המזונות שבדקתם.
        </p>
        <h2 className="text-lg font-semibold text-leaf-dark">קישורים חיצוניים</h2>
        <p>
          לחיצה על קישור לאתר "המרכז לבריאות טבעית", לוואטסאפ או לחיוג מעבירה אתכם לשירות חיצוני, שחלה עליו מדיניות הפרטיות
          שלו.
        </p>
        <h2 className="text-lg font-semibold text-leaf-dark">יצירת קשר</h2>
        <p>
          לשאלות בנושא פרטיות: יאיר גלעדי, ״המרכז לבריאות טבעית״, טלפון{' '}
          <a href="tel:+972542135831" dir="ltr" className="font-medium text-leaf-dark hover:underline">054-2135831</a>.
        </p>
      </div>
      <Link to="/" className="btn-primary mt-5">חזרה לאפליקציה</Link>
    </article>
  );
}
