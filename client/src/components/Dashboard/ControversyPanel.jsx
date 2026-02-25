import { ExternalLink, AlertTriangle } from 'lucide-react';
import SeverityBadge from '../shared/SeverityBadge';
import CategoryChips from '../shared/CategoryChips';
import { formatDate } from '../../utils/helpers';
import { getCategoryOverlap } from '../../utils/categoryUtils';

export default function ControversyPanel({ controversies, currentBrands = [] }) {
  if (!controversies || controversies.length === 0) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-green-600 dark:text-green-400">
        <AlertTriangle className="w-4 h-4" />
        No controversies on record.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {controversies.map(controversy => {
        const relevance = controversy.relevance_to_brands || [];

        // Find which of our current brands are affected
        const affectedBrands = currentBrands.filter(brand => {
          const brandCats = brand.categories || [];
          const { directMatches, sharedParents } = getCategoryOverlap(relevance, brandCats);
          return directMatches.length > 0 || sharedParents.length > 0;
        });

        return (
          <div key={controversy.id} className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="flex items-start justify-between gap-2 p-3 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <SeverityBadge severity={controversy.severity} />
                  <span className="font-medium text-sm text-gray-900 dark:text-gray-100">{controversy.title}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {formatDate(controversy.date_occurred)}
                  {controversy.category && ` · ${controversy.category}`}
                </p>
              </div>
              {controversy.source_url && (
                <a href={controversy.source_url} target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:text-brand-700 flex-shrink-0">
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>

            {controversy.summary && (
              <p className="text-xs text-gray-600 dark:text-gray-400 px-3 py-2 leading-relaxed border-t border-gray-100 dark:border-gray-700">
                {controversy.summary}
              </p>
            )}

            {(relevance.length > 0 || affectedBrands.length > 0) && (
              <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30">
                {relevance.length > 0 && (
                  <div className="mb-1.5">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Affects brand categories:</p>
                    <CategoryChips chips={relevance.map(r => ({ category: r, status: 'red' }))} size="xs" />
                  </div>
                )}
                {affectedBrands.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 mb-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Flags {affectedBrands.length} of your brand{affectedBrands.length !== 1 ? 's' : ''}:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {affectedBrands.map(b => (
                        <span key={b.id} className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800 font-medium">
                          {b.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
