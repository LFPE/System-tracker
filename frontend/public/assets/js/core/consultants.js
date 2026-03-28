const CONSULTANT_RULES = [
  { terms: ['amanda'], label: 'Amanda Neves' },
  { terms: ['vitoria', 'vitória'], label: 'Vitoria Calixto' },
  { terms: ['martin'], label: 'Martin Silva' },
  { terms: ['nobean', 'nôbean'], label: 'Nôbean Silva' },
  { terms: ['jenifer', 'jennifer'], label: 'Jenifer Afonso' },
  { terms: ['tamires'], label: 'Tamires Perotto' },
  { terms: ['rebeca'], label: 'Rebeca Silva' },
  { terms: ['beatriz', 'andrea'], label: 'Beatriz/Andréa' },
  { terms: ['beatriz', 'andréa'], label: 'Beatriz/Andréa' },
  { terms: ['beatriz'], label: 'Beatriz S.' },
  { terms: ['andrea'], label: 'Beatriz/Andréa' },
  { terms: ['andréa'], label: 'Beatriz/Andréa' },
];

export const TRACKED_CONSULTANTS = CONSULTANT_RULES
  .map((rule) => rule.label)
  .filter((value, index, array) => array.indexOf(value) === index);

export function normalizeConsultantName(name, { strict = false } = {}) {
  if (!name) {
    return strict ? null : '-';
  }

  const normalized = name.toLowerCase().trim();
  const match = CONSULTANT_RULES.find((rule) => rule.terms.every((term) => normalized.includes(term)));

  if (match) {
    return match.label;
  }

  if (strict) {
    return null;
  }

  return name
    .split(' ')
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function getConsultantSearchTerms() {
  return CONSULTANT_RULES.flatMap((rule) => rule.terms)
    .filter((value, index, array) => array.indexOf(value) === index);
}