export const SEVERITY_CONFIG = {
  low: { label: 'Low', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', dot: 'bg-green-500' },
  medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', dot: 'bg-yellow-500' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400', dot: 'bg-orange-500' },
  critical: { label: 'Critical', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', dot: 'bg-red-500' },
};

export const RECOMMENDATION_CONFIG = {
  'Strong Fit': { color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800', badge: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  'Proceed with Caution': { color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800', badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  'High Risk': { color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800', badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  'Do Not Recommend': { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800', badge: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
};

export const CHIP_STATUS_STYLES = {
  green: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800',
  yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800',
  red: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800',
};

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function formatNumber(n) {
  if (!n) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

export function getCorrelationLabel(r) {
  if (r === null || r === undefined) return { label: 'No data', color: 'text-gray-400' };
  if (r >= 0.6) return { label: 'Strong Positive', color: 'text-green-600 dark:text-green-400' };
  if (r >= 0.2) return { label: 'Moderate Positive', color: 'text-green-500 dark:text-green-500' };
  if (r >= -0.2) return { label: 'Neutral', color: 'text-yellow-600 dark:text-yellow-400' };
  if (r >= -0.6) return { label: 'Moderate Negative', color: 'text-orange-600 dark:text-orange-400' };
  return { label: 'Strong Negative', color: 'text-red-600 dark:text-red-400' };
}

export function getCorrelationBarColor(r) {
  if (r === null || r === undefined) return 'bg-gray-300';
  if (r >= 0.6) return 'bg-green-500';
  if (r >= 0.2) return 'bg-green-400';
  if (r >= -0.2) return 'bg-yellow-400';
  if (r >= -0.6) return 'bg-orange-400';
  return 'bg-red-500';
}

export function avatarFallback(name) {
  if (!name) return '?';
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function clsx(...classes) {
  return classes.filter(Boolean).join(' ');
}
