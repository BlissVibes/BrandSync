import { Building2, AlertTriangle, TrendingUp, Twitch, Youtube } from 'lucide-react';
import Avatar from '../shared/Avatar';
import SeverityBadge from '../shared/SeverityBadge';
import { formatNumber } from '../../utils/helpers';

const platformIcons = {
  Twitch: <Twitch className="w-3.5 h-3.5 text-purple-500" />,
  YouTube: <Youtube className="w-3.5 h-3.5 text-red-500" />,
  Both: <span className="text-xs text-gray-400">TW/YT</span>,
};

export default function ClientCard({ client, onClick }) {
  const { name, display_name, image_url, category, platform, org, activeBrandCount, controversyCount, worstSeverity } = client;

  return (
    <div
      className="card p-5 cursor-pointer hover:shadow-md hover:border-brand-200 dark:hover:border-brand-700 transition-all group"
      onClick={() => onClick?.(client)}
    >
      <div className="flex items-start gap-3 mb-3">
        <Avatar src={image_url} name={name} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate text-sm group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
              {display_name || name}
            </h3>
            {platformIcons[platform]}
          </div>
          {org && <p className="text-xs text-gray-500 dark:text-gray-400">{org}</p>}
          {category && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{category}</p>}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs pt-3 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
          <Building2 className="w-3.5 h-3.5" />
          <span>{activeBrandCount} active brand{activeBrandCount !== 1 ? 's' : ''}</span>
        </div>

        {controversyCount > 0 ? (
          <SeverityBadge severity={worstSeverity} size="xs" />
        ) : (
          <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Clean</span>
          </span>
        )}
      </div>

      {controversyCount > 0 && (
        <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
          <AlertTriangle className="w-3 h-3" />
          <span>{controversyCount} controvers{controversyCount !== 1 ? 'ies' : 'y'}</span>
        </div>
      )}
    </div>
  );
}
