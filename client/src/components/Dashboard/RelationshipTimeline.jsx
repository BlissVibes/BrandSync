import { ExternalLink, User, Building2, ArrowRight, HelpCircle } from 'lucide-react';
import { formatDate } from '../../utils/helpers';

const endedByConfig = {
  client: { label: 'Client ended', icon: <User className="w-3 h-3" />, color: 'text-blue-600 dark:text-blue-400' },
  brand: { label: 'Brand ended', icon: <Building2 className="w-3 h-3" />, color: 'text-orange-600 dark:text-orange-400' },
  mutual: { label: 'Mutual', icon: <ArrowRight className="w-3 h-3" />, color: 'text-gray-500' },
  unknown: { label: 'Unknown', icon: <HelpCircle className="w-3 h-3" />, color: 'text-gray-400' },
};

export default function RelationshipTimeline({ relationships }) {
  if (!relationships || relationships.length === 0) {
    return <p className="text-sm text-gray-400 py-2">No brand partnerships on record.</p>;
  }

  return (
    <div className="space-y-2">
      {relationships.map(rel => {
        const isActive = rel.status === 'active';
        const endedCfg = endedByConfig[rel.ended_by] || endedByConfig.unknown;

        return (
          <div
            key={rel.id}
            className={`flex items-start gap-3 p-3 rounded-lg border ${
              isActive
                ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/10'
                : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50'
            }`}
          >
            {/* Status indicator */}
            <div className={`mt-0.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${isActive ? 'bg-green-500' : 'bg-gray-400'}`} />

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <span className="font-medium text-sm text-gray-900 dark:text-gray-100">{rel.brand_name}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    {isActive ? 'Active' : 'Ended'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                <span>{formatDate(rel.start_date)}</span>
                {rel.end_date && (
                  <>
                    <ArrowRight className="w-3 h-3" />
                    <span>{formatDate(rel.end_date)}</span>
                  </>
                )}
                {!isActive && (
                  <span className={`flex items-center gap-1 ${endedCfg.color}`}>
                    {endedCfg.icon}
                    {endedCfg.label}
                  </span>
                )}
              </div>

              {!isActive && rel.end_reason && (
                <p className="mt-1.5 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{rel.end_reason}</p>
              )}

              {rel.end_reason_source_url && (
                <a
                  href={rel.end_reason_source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-1 text-xs text-brand-600 dark:text-brand-400 hover:underline"
                  onClick={e => e.stopPropagation()}
                >
                  <ExternalLink className="w-3 h-3" />
                  Source
                </a>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
