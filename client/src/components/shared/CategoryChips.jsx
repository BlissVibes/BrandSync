import { CHIP_STATUS_STYLES } from '../../utils/helpers';

export default function CategoryChips({ chips, size = 'sm' }) {
  if (!chips || chips.length === 0) return null;

  const sizeClass = size === 'xs' ? 'text-xs px-1.5 py-0.5' : 'text-xs px-2 py-0.5';

  return (
    <div className="flex flex-wrap gap-1">
      {chips.map((chip, i) => {
        const status = typeof chip === 'string' ? 'green' : chip.status;
        const label = typeof chip === 'string' ? chip : chip.category;
        const style = CHIP_STATUS_STYLES[status] || CHIP_STATUS_STYLES.green;
        return (
          <span key={i} className={`inline-flex items-center rounded-full font-medium ${sizeClass} ${style}`}>
            {label}
          </span>
        );
      })}
    </div>
  );
}
