import { Link } from 'react-router-dom';
import { PageTitle } from '../components/ui';
import { TIPS } from '../data/tips';

export default function Tips() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageTitle title="טיפים מהשיטה" subtitle="מעבר לצירופים עצמם: מתי לאכול, כמה להמתין בין ארוחות ואיך לבנות את היום." />
      <ul className="grid gap-3 sm:grid-cols-2">
        {TIPS.map((t) => (
          <li key={t.id} className="card p-4">
            <h2 className="flex items-center gap-2 font-semibold"><span aria-hidden className="text-2xl">{t.icon}</span>{t.title}</h2>
            <p className="mt-2 text-ink/85">{t.text}</p>
          </li>
        ))}
      </ul>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link to="/" className="btn-primary">חזרה לאפליקציה</Link>
        <Link to="/why" className="btn-soft">למה זה חשוב?</Link>
      </div>
    </div>
  );
}
