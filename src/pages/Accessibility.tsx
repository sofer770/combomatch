import { Link } from 'react-router-dom';
import { PageTitle } from '../components/ui';

const UPDATED = '16 בנובמבר 2026';

export default function Accessibility() {
  return (
    <article className="mx-auto max-w-2xl">
      <PageTitle title="הצהרת נגישות" subtitle={`עודכנה לאחרונה: ${UPDATED}`} />
      <div className="card space-y-4 p-5 leading-7 text-ink/90 sm:p-6">
        <p>
          אנו רואים חשיבות רבה במתן שירות שוויוני ונגיש לכל המשתמשים, כולל אנשים עם מוגבלות. האפליקציה ComboMatch נבנתה
          מתוך כוונה לעמוד בדרישות תקן ישראלי 5568 ובהנחיות WCAG 2.1 ברמה AA.
        </p>
        <h2 className="text-lg font-semibold text-leaf-dark">מה נעשה באפליקציה</h2>
        <ul className="list-disc space-y-1 ps-5">
          <li>ניווט מלא באמצעות מקלדת, עם סימון ברור של הרכיב הנבחר.</li>
          <li>קישור "דלג לתוכן" בתחילת כל עמוד.</li>
          <li>תוויות ותיאורים לקוראי מסך בכפתורים, בטפסים ובחלונות.</li>
          <li>תוצאות הבדיקה מוצגות גם בטקסט ובסימן (✓ / ✗ / ?), ולא רק בצבע.</li>
          <li>ניגודיות צבעים מספקת, ומצב כהה שמופעל לפי הגדרות המכשיר.</li>
          <li>התאמה לטלפון, לטאבלט ולמחשב, ותמיכה בהגדלת טקסט בדפדפן.</li>
          <li>שפה ברורה, כיווניות מימין לשמאל ומבנה כותרות עקבי.</li>
        </ul>
        <h2 className="text-lg font-semibold text-leaf-dark">מגבלות ידועות</h2>
        <p>
          ייתכן שחלקים מסוימים עדיין אינם נגישים במלואם. אנו ממשיכים לשפר את הנגישות באופן שוטף.
        </p>
        <h2 className="text-lg font-semibold text-leaf-dark">פנייה בנושא נגישות</h2>
        <p>
          נתקלתם בבעיית נגישות או שיש לכם הצעה לשיפור? נשמח לשמוע ולטפל בהקדם.
        </p>
        <ul className="space-y-1">
          <li>רכז הנגישות: יאיר גלעדי, ״המרכז לבריאות טבעית״</li>
          <li>טלפון: <a href="tel:+972542135831" dir="ltr" className="font-medium text-leaf-dark hover:underline">054-2135831</a></li>
          <li>אתר: <a href="https://el-habriut.co.il" target="_blank" rel="noopener noreferrer" dir="ltr" className="font-medium text-leaf-dark hover:underline">el-habriut.co.il</a></li>
        </ul>
      </div>
      <Link to="/" className="btn-primary mt-5">חזרה לאפליקציה</Link>
    </article>
  );
}
