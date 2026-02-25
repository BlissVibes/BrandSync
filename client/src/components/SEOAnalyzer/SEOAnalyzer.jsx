import { useState, useEffect } from 'react';
import { TrendingUp, BarChart2, AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import CorrelationChart from '../shared/CorrelationChart';
import SeverityBadge from '../shared/SeverityBadge';
import CategoryChips from '../shared/CategoryChips';
import EmptyState from '../shared/EmptyState';
import { clientsApi, brandsApi, seoApi } from '../../services/api';
import { getCorrelationLabel, getCorrelationBarColor, RECOMMENDATION_CONFIG, formatNumber } from '../../utils/helpers';
import { getCategoryOverlap } from '../../utils/categoryUtils';
import { toast } from 'sonner';

export default function SEOAnalyzer() {
  const [clients, setClients] = useState([]);
  const [brands, setBrands] = useState([]);
  const [mode, setMode] = useState('existing'); // 'existing' | 'adhoc'
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [adhocClient, setAdhocClient] = useState('');
  const [adhocBrand, setAdhocBrand] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([clientsApi.list(), brandsApi.list()])
      .then(([c, b]) => { setClients(c); setBrands(b); })
      .catch(() => {});
  }, []);

  const analyze = async () => {
    setLoading(true);
    setResult(null);
    try {
      let data;
      if (mode === 'existing') {
        if (!selectedClient || !selectedBrand) { toast.error('Select a client and brand'); setLoading(false); return; }
        data = await seoApi.correlation(selectedClient, selectedBrand);
      } else {
        if (!adhocClient || !adhocBrand) { toast.error('Enter both client and brand names'); setLoading(false); return; }
        data = await seoApi.adhocCorrelation({ client_name: adhocClient, brand_name: adhocBrand });
      }
      setResult(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const coeff = result?.correlation?.coefficient;
  const corrLabel = getCorrelationLabel(coeff);
  const barColor = getCorrelationBarColor(coeff);
  const recConfig = result ? RECOMMENDATION_CONFIG[result.riskAssessment?.recommendation] : null;

  const brandCats = result?.brand?.categories || [];

  // Build category overlap chips
  const categoryChips = brandCats.map(cat => {
    const directHit = (result?.controversyFlags || []).some(c =>
      (c.relevance_to_brands || []).includes(cat)
    );
    if (directHit) return { category: cat, status: 'red' };

    const { sharedParents } = getCategoryOverlap(
      (result?.controversyFlags || []).flatMap(c => c.relevance_to_brands || []),
      [cat]
    );
    if (sharedParents.length > 0) return { category: cat, status: 'yellow' };

    return { category: cat, status: 'green' };
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">SEO Correlation Analyzer</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Compare search trends and assess brand-client compatibility</p>
      </div>

      {/* Input section */}
      <div className="card p-5 space-y-4">
        {/* Mode toggle */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-fit">
          {[['existing', 'From Dashboard'], ['adhoc', 'Ad-hoc Search']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => { setMode(val); setResult(null); }}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${mode === val ? 'tab-active' : 'tab-inactive'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {mode === 'existing' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Client</label>
              <select className="select" value={selectedClient} onChange={e => { setSelectedClient(e.target.value); setResult(null); }}>
                <option value="">Select client...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.display_name || c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Brand</label>
              <select className="select" value={selectedBrand} onChange={e => { setSelectedBrand(e.target.value); setResult(null); }}>
                <option value="">Select brand...</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name} — {b.primary_category}</option>)}
              </select>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Client Name</label>
              <input className="input" value={adhocClient} onChange={e => setAdhocClient(e.target.value)} placeholder="e.g. Ninja" />
            </div>
            <div>
              <label className="label">Brand Name</label>
              <input className="input" value={adhocBrand} onChange={e => setAdhocBrand(e.target.value)} placeholder="e.g. Red Bull" />
            </div>
          </div>
        )}

        <button onClick={analyze} disabled={loading} className="btn-primary">
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <BarChart2 className="w-4 h-4" />}
          {loading ? 'Analyzing...' : 'Analyze Correlation'}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Correlation score */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div>
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">SEO Correlation Score</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {result.client?.display_name || result.client?.name || result.client?.name} × {result.brand?.name}
                </p>
              </div>
              <div className="text-right">
                <div className={`text-4xl font-bold ${corrLabel.color}`}>
                  {coeff !== null ? coeff.toFixed(2) : '—'}
                </div>
                <div className={`text-sm font-medium ${corrLabel.color}`}>{corrLabel.label}</div>
              </div>
            </div>

            {/* Correlation bar */}
            <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full mb-1">
              <div
                className={`absolute top-0 h-3 rounded-full transition-all ${barColor}`}
                style={{ width: `${Math.round(((coeff ?? 0) + 1) / 2 * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>-1 (Negative)</span>
              <span>0 (Neutral)</span>
              <span>+1 (Positive)</span>
            </div>

            {/* Data source badge */}
            {result.correlation?.source && (
              <div className="flex items-center gap-1.5 mt-3">
                {result.correlation.source === 'google_trends' ? (
                  <span className="inline-flex items-center gap-1 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                    <Wifi className="w-3 h-3" /> Google Trends · relative interest (0–100)
                  </span>
                ) : result.correlation.source === 'mock' ? (
                  <span className="inline-flex items-center gap-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
                    <WifiOff className="w-3 h-3" /> Simulated data — Google Trends unavailable
                  </span>
                ) : null}
              </div>
            )}

            {/* Trend chart */}
            {result.correlation?.clientData?.length > 0 && (
              <div className="mt-4">
                <CorrelationChart
                  clientData={result.correlation.clientData}
                  brandData={result.correlation.brandData}
                  clientName={result.client?.display_name || result.client?.name}
                  brandName={result.brand?.name}
                />
              </div>
            )}
          </div>

          {/* Category match */}
          {brandCats.length > 0 && (
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Category Match Analysis
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                {brandCats.length} categories · Green = clean, Red = controversy overlap, Yellow = adjacent parent match
              </p>
              <CategoryChips chips={categoryChips} />
            </div>
          )}

          {/* Controversy cross-check */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              Controversy Cross-Check
            </h2>
            {result.controversyFlags && result.controversyFlags.length > 0 ? (
              <div className="space-y-3">
                {result.controversyFlags.map(c => (
                  <div key={c.id} className="flex items-start gap-2 p-3 bg-orange-50 dark:bg-orange-900/10 rounded-lg border border-orange-200 dark:border-orange-800">
                    <SeverityBadge severity={c.severity} />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{c.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{c.category}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(c.categoryOverlap?.directMatches || []).map(m => (
                          <span key={m} className="text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-1.5 py-0.5 rounded-full">{m}</span>
                        ))}
                        {(c.categoryOverlap?.sharedParents || []).map(p => (
                          <span key={p} className="text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 px-1.5 py-0.5 rounded-full">via {p}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-green-600 dark:text-green-400">No relevant controversies found for this brand category.</p>
            )}
          </div>

          {/* Risk Assessment */}
          {result.riskAssessment && recConfig && (
            <div className={`card p-5 border ${recConfig.bg}`}>
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Risk Assessment</h2>
              <div className="flex items-center gap-3 mb-3">
                <span className={`text-2xl font-bold ${recConfig.color}`}>
                  {result.riskAssessment.recommendation}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${recConfig.badge}`}>
                  Score: {result.riskAssessment.score}
                </span>
              </div>
              <ul className="space-y-1">
                {result.riskAssessment.reasons.map((r, i) => (
                  <li key={i} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-1.5">
                    <span className="mt-0.5 text-gray-400">·</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {!result && !loading && (
        <EmptyState
          icon={TrendingUp}
          title="Select a client and brand to analyze"
          description="Compare SEO trends, find keyword overlap, and check for controversy flags in the brand's category."
        />
      )}
    </div>
  );
}
