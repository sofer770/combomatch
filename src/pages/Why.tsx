import { Link } from 'react-router-dom';
import { DISCLAIMER } from '../components/ui';

// Original explanatory text, written for the app (claims framed as the method's view).
export default function Why() {
  return (
    <article className="mx-auto max-w-2xl">
      <Link to="/" className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-leaf-dark hover:underline">→ חזרה לאפליקציה</Link>
      <header className="mb-5">
        <p className="text-sm font-semibold text-leaf-dark">לפי שיטת צירופי המזון</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">למה חשוב לשמור על צירופי מזון?</h1>
      </header>

      <div className="card space-y-4 p-5 text-[17px] leading-8 text-ink/90 sm:p-6">
        <p>
          רובנו כבר יודעים שחשוב לבחור מזון טבעי ואיכותי. שיטת צירופי המזון מוסיפה לכך שאלה נוספת: לא רק מה אנחנו אוכלים,
          אלא גם מה אנחנו אוכלים יחד באותה ארוחה. לפי שיטת הבריאות הטבעית, צירוף נכון של מזונות מקל על העיכול, תומך באנרגיה יציבה לאורך
          היום ותורם לתחושה טובה בגוף.
        </p>
        <p>
          ארוחה יכולה להיות מורכבת כולה ממזונות בריאים, ועדיין להכביד על הגוף. הסיבה לכך טמונה באופן שבו מערכת העיכול
          מטפלת בסוגי מזון שונים.
        </p>

        <h2 className="pt-2 text-xl font-semibold text-leaf-dark">כל מזון והעיכול שלו</h2>
        <p>
          הגוף מפרק מזון בעזרת אנזימים, וכל אנזים מתמחה בסוג מזון אחד. האנזימים שמפרקים עמילנים שונים מאלה שמפרקים חלבונים
          או שומנים. גם הסביבה שבה כל אחד מהם פועל שונה: עיכול חלבון נעשה בסביבה חומצית, ואילו עיכול עמילן מתחיל כבר בפה
          ונעשה בסביבה בסיסית.
        </p>
        <p>
          כשאוכלים יחד מזונות שדורשים תנאי עיכול שונים, למשל בשר עם תפוחי אדמה, הקיבה נדרשת לעבוד בשני כיוונים בבת אחת.
          לפי שיטת הבריאות הטבעית, העיכול נעשה איטי ופחות יעיל, והמזון שוהה במערכת העיכול זמן רב יותר.
        </p>
        <p className="rounded-2xl bg-leaf-soft p-4 font-medium text-ink">
          הרעיון המרכזי פשוט: להפריד בין סוגי מזון שאינם מתעכלים טוב יחד, ולתת לקיבה זמן לסיים את עבודתה לפני הארוחה הבאה.
        </p>

        <h2 className="pt-2 text-xl font-semibold text-leaf-dark">מה קורה כשהצירוף לא מתאים?</h2>
        <p>
          לפי שיטת הבריאות הטבעית, מזון שמתעכל לאט ובצורה חלקית עלול לתסוס במערכת העיכול. רבים מרגישים זאת כנפיחות, גזים, כבדות, עייפות
          אחרי הארוחה או עצירות. מוכרת לכם העייפות שמגיעה אחרי ארוחת צהריים של מנה עיקרית ותוספת? לפי שיטת הבריאות הטבעית, זו בדיוק
          הדוגמה הנפוצה ביותר לצירוף שאינו מתאים.
        </p>
        <p>
          הקפדה על צירופים נכונים עוזרת להפיק יותר מהמזון שאנחנו אוכלים, ולסיים את הארוחה בתחושת קלילות. ComboMatch נועדה
          לעשות את זה פשוט: בוחרים מזונות, ומקבלים מיד תשובה ברורה לפי כללי שיטת הבריאות הטבעית.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link to="/" className="btn-primary">חזרה לאפליקציה</Link>
        <Link to="/rules" className="btn-soft">טבלת המותר והאסור</Link>
      </div>
      <p className="mt-4 text-xs text-muted">{DISCLAIMER}</p>
    </article>
  );
}
