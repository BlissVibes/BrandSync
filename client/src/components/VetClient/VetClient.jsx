import { useState } from 'react';
import { UserSearch, ChevronDown, ChevronRight, Search, TrendingUp, AlertTriangle, Plus } from 'lucide-react';
import Avatar from '../shared/Avatar';
import SeverityBadge from '../shared/SeverityBadge';
import CategoryChips from '../shared/CategoryChips';
import CorrelationChart from '../shared/CorrelationChart';
import EmptyState from '../shared/EmptyState';
import { CardSkeleton } from '../shared/Skeleton';
import { vetApi, clientsApi, seoApi } from '../../services/api';
import { RECOMMENDATION_CONFIG, getCorrelationLabel, formatNumber } from '../../utils/helpers';
import { toast } from 'sonner';
import AddClientModal from '../shared/AddClientModal';

export default function VetClient() {
  const [clientName, setClientName] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});
  const [showAddClient, setShowAddClient] = useState(false);

  const vet = async () => {
    if (!clientName.trim()) return;
    setLoading(true);
    setResult(null);
    setExpandedRows({});
    try {
      const data = await vetApi.vet({ client_name: clientName.trim() });
      setResult(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (id) => setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));

  const handleAddClient = async () => {
    if (!result) return;
    setShowAddClient(true);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Vet New Client</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Check if a potential new client is compatible with your existing brand portfolio
        </p>
      </div>

      {/* Search input */}
      <div className="card p-5">
        <label className="label">New Client Name</label>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <UserSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="input pl-10"
              value={clientName}
              onChange={e => setClientName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && vet()}
              placeholder="e.g. Valkyrae, Shroud, xQc..."
            />
          </div>
          <button className="btn-primary" onClick={vet} disabled={loading || !clientName.trim()}>
            {loading ? (
              <span className="flex items-center gap-2"><TrendingUp className="w-4 h-4 animate-pulse" /> Vetting...</span>
            ) : (
              <span className="flex items-center gap-2"><Search className="w-4 h-4" /> Vet Client</span>
            )}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          This will compare the client against all brands in your portfolio using SEO data and controversy cross-referencing.
        </p>
      </div>

      {loading && (
        <div className="space-y-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      )}

      {result && !loading && (
        <div className="space-y-4">
          {/* Client profile card */}
          <div className="card p-5">
            <div className="flex items-start gap-4">
              <Avatar src={result.image_url} name={result.clientName} size="xl" />
              <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{result.clientName}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Vetting against {result.summary.totalBrands} brand{result.summary.totalBrands !== 1 ? 's' : ''} in portfolio
                </p>
                <div className="mt-3">
                  <span className={`inline-block text-sm font-semibold px-3 py-1.5 rounded-full ${
                    result.summary.strongFit > result.summary.totalBrands / 2
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : result.summary.strongFit > 0
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    Strong fit for {result.summary.strongFit} of {result.summary.totalBrands} brands
                  </span>
                </div>
              </div>
              <button
                className="btn-secondary text-xs flex-shrink-0"
                onClick={handleAddClient}
              >
                <Plus className="w-3.5 h-3.5" />
                Add to Dashboard
              </button>
            </div>
          </div>

          {/* Comparison matrix */}
          {result.matrix.length === 0 ? (
            <EmptyState
              icon={AlertTriangle}
              title="No brands in portfolio"
              description="Add brands to your portfolio first to run a comparison."
            />
          ) : (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 px-1">
                Brand Compatibility Matrix
              </h2>
              {result.matrix.map((row, i) => {
                const recCfg = RECOMMENDATION_CONFIG[row.recommendation] || RECOMMENDATION_CONFIG['Proceed with Caution'];
                const corrLabel = getCorrelationLabel(row.coefficient);
                const expanded = expandedRows[row.brand.id];

                return (
                  <div key={row.brand.id} className={`card border ${recCfg.bg} overflow-hidden`}>
                    {/* Row header */}
                    <button
                      className="w-full flex items-center gap-3 p-4 text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      onClick={() => toggleRow(row.brand.id)}
                    >
                      {/* Rank */}
                      <span className="text-xs font-bold text-gray-400 w-5 flex-shrink-0">#{i + 1}</span>

                      {/* Brand info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">{row.brand.name}</span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${recCfg.badge}`}>
                            {row.recommendation}
                          </span>
                        </div>
                        {/* Category chips */}
                        <div className="mt-1.5">
                          <CategoryChips chips={row.categoryChips} size="xs" />
                        </div>
                      </div>

                      {/* Scores */}
                      <div className="flex items-center gap-4 flex-shrink-0 text-right">
                        <div>
                          <p className={`text-sm font-bold ${corrLabel.color}`}>
                            {row.coefficient !== null ? row.coefficient.toFixed(2) : '—'}
                          </p>
                          <p className="text-xs text-gray-400">SEO corr.</p>
                        </div>
                        <div>
                          <p className={`text-sm font-bold ${row.overlapCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                            {row.overlapCount}
                          </p>
                          <p className="text-xs text-gray-400">conflict{row.overlapCount !== 1 ? 's' : ''}</p>
                        </div>
                        {expanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                      </div>
                    </button>

                    {/* Expanded detail */}
                    {expanded && (
                      <div className="border-t border-current/10 p-4 bg-white/50 dark:bg-black/10 space-y-4">
                        {/* Category breakdown */}
                        <div>
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Category Breakdown</p>
                          <div className="flex flex-wrap gap-1.5">
                            {row.categoryChips.map((chip, j) => {
                              const statusLabels = { red: 'Direct conflict', yellow: 'Adjacent match', green: 'Clean' };
                              return (
                                <div key={j} className="flex flex-col items-center gap-0.5">
                                  <span className={`text-xs px-2 py-1 rounded-full font-medium border ${
                                    chip.status === 'red'
                                      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800'
                                      : chip.status === 'yellow'
                                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800'
                                      : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800'
                                  }`}>
                                    {chip.category}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                          {row.overlapCount > 0 && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1.5">
                              {row.overlapCount} category conflict{row.overlapCount !== 1 ? 's' : ''} · {row.adjacentCount} adjacent
                            </p>
                          )}
                        </div>

                        {/* Controversy flags */}
                        {row.controversyFlags.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 mb-2 flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Controversy Flags ({row.controversyFlags.length})
                            </p>
                            <div className="space-y-2">
                              {row.controversyFlags.map(c => (
                                <div key={c.id} className="flex items-start gap-2">
                                  <SeverityBadge severity={c.severity} size="xs" />
                                  <div>
                                    <p className="text-xs font-medium text-gray-900 dark:text-gray-100">{c.title}</p>
                                    {c.summary && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{c.summary}</p>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* SEO Trend chart */}
                        {row.clientTrendData.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">SEO Trend Comparison</p>
                            <CorrelationChart
                              clientData={row.clientTrendData}
                              brandData={row.brandTrendData}
                              clientName={result.clientName}
                              brandName={row.brand.name}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {!result && !loading && (
        <EmptyState
          icon={UserSearch}
          title="Enter a client name to begin vetting"
          description="We'll analyze their compatibility with every brand in your portfolio, check for category conflicts, and flag any relevant controversies."
        />
      )}

      <AddClientModal
        open={showAddClient}
        onClose={() => setShowAddClient(false)}
        onAdded={(c) => {
          toast.success(`${c.name} added to dashboard`);
          setShowAddClient(false);
        }}
      />
    </div>
  );
}
