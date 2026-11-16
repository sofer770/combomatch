import type { CombinationRule, VerificationStatus } from '../domain/types';
import matrix from './method-matrix.json';

/*
 * Combination rules of the practitioner's method, loaded from method-matrix.json.
 * The JSON was drafted ONLY from the method document "מהי שיטת צירופי המזון":
 *   status "explicit" -> verified rule
 *   status "inferred" -> rule marked "unverified" (an interpretation of the document)
 *   status "undefined" -> NO rule, so the engine reports the pair as "טרם הוגדר"
 * The document defines no "yellow" level. Explanations are phrased as the method's position.
 */

export const METHOD_MATRIX_VERSION = matrix.version;
export const METHOD_SOURCE_DOC = 'מסמך השיטה: מהי שיטת צירופי המזון';

const RED_SUGGESTION = 'לפי השיטה, הפרידו את הרכיבים לארוחות נפרדות, או החליפו אחד מהם ברכיב שמשתלב לפי הכללים.';

// sourced = decided from a cited external source (Shelton) at the practitioner's request.
const statusMap: Record<string, VerificationStatus> = { explicit: 'verified', sourced: 'verified', inferred: 'unverified' };

export const METHOD_RULES: CombinationRule[] = matrix.rules
  .filter((r) => r.status !== 'undefined' && r.level !== 'unknown')
  .map((r) => ({
    id: `m_${r.id}`,
    familyA: r.familyA,
    familyB: r.familyB,
    level: r.level as CombinationRule['level'],
    title: r.explanation.replace(/\.$/, ''),
    explanation: r.status === 'sourced' ? r.explanation : `על פי כללי השיטה: ${r.explanation}`,
    suggestion: r.level === 'red' ? RED_SUGGESTION : '',
    source: r.status === 'sourced' ? r.source : `${METHOD_SOURCE_DOC} (${r.source})`,
    verificationStatus: statusMap[r.status] ?? 'unverified',
    updatedAt: `${matrix.date}T00:00:00.000Z`,
  }));
