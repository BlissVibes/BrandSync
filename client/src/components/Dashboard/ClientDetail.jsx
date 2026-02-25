import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, TrendingUp, AlertTriangle, Calendar, Edit2, Trash2, RefreshCw } from 'lucide-react';
import Avatar from '../shared/Avatar';
import SeverityBadge from '../shared/SeverityBadge';
import RelationshipTimeline from './RelationshipTimeline';
import ControversyPanel from './ControversyPanel';
import AddRelationshipModal from './AddRelationshipModal';
import { CardSkeleton } from '../shared/Skeleton';
import { clientsApi, brandsApi } from '../../services/api';
import { formatDate, formatNumber } from '../../utils/helpers';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { toast } from 'sonner';

export default function ClientDetail({ clientId, onBack, onEdit, allBrands = [] }) {
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddRel, setShowAddRel] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await clientsApi.get(clientId);
      setClient(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [clientId]);

  if (loading) return (
    <div className="space-y-4">
      <CardSkeleton />
      <CardSkeleton />
    </div>
  );

  if (!client) return null;

  const primarySEO = client.seoData?.[0];
  const trendData = primarySEO?.trend_data || [];
  const activeBrands = client.relationships.filter(r => r.status === 'active').map(r => ({
    id: r.brand_id,
    name: r.brand_name,
    categories: r.categories || [],
    parent_categories: r.parent_categories || [],
    logo_url: r.logo_url,
  }));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="btn-ghost">
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      {/* Profile card */}
      <div className="card p-5">
        <div className="flex items-start gap-4">
          <Avatar src={client.image_url} name={client.name} size="xl" />
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{client.display_name || client.name}</h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
              <span>{client.platform}</span>
              {client.org && <span>· {client.org}</span>}
              {client.category && <span>· {client.category}</span>}
              <span>· Added {formatDate(client.added_date)}</span>
            </div>
            {client.notes && <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{client.notes}</p>}
          </div>
          <div className="flex gap-2">
            <button className="btn-ghost" onClick={() => onEdit?.(client)}>
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <div className="text-center">
            <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">{activeBrands.length}</p>
            <p className="text-xs text-gray-500">Active Brands</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{client.controversies.length}</p>
            <p className="text-xs text-gray-500">Controversies</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
              {primarySEO ? formatNumber(primarySEO.search_volume) : '—'}
            </p>
            <p className="text-xs text-gray-500">Search Volume</p>
          </div>
        </div>
      </div>

      {/* SEO Trend */}
      {trendData.length > 0 && (
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brand-500" />
            SEO Interest Over Time — "{primarySEO?.keyword}"
          </h2>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={trendData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />
              <XAxis dataKey="month" tick={{ fontSize: 9 }} tickFormatter={v => v.slice(2)} interval={3} tickLine={false} />
              <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} width={24} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
              <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Brand Partnerships */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Brand Partnerships</h2>
          <button className="btn-primary text-xs" onClick={() => setShowAddRel(true)}>
            <Plus className="w-3.5 h-3.5" />
            Add Brand
          </button>
        </div>
        <RelationshipTimeline relationships={client.relationships} />
      </div>

      {/* Controversies */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-orange-500" />
          Controversies & Risk Flags
          {client.controversies.length > 0 && (
            <span className="ml-auto text-xs font-normal text-gray-400">{client.controversies.length} on record</span>
          )}
        </h2>
        <ControversyPanel
          controversies={client.controversies}
          currentBrands={activeBrands}
        />
      </div>

      {/* Sponsorship History */}
      {client.sponsorships && client.sponsorships.length > 0 && (
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-gray-400" />
            Full Sponsorship History
          </h2>
          <div className="space-y-2">
            {client.sponsorships.map(s => (
              <div key={s.id} className={`flex items-start gap-3 p-2.5 rounded-lg text-sm ${
                s.status === 'active' ? 'bg-green-50 dark:bg-green-900/10' : 'bg-gray-50 dark:bg-gray-800/30'
              }`}>
                <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${s.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-gray-900 dark:text-gray-100">{s.brand_name}</span>
                    <span className="text-xs text-gray-400 flex-shrink-0">{formatDate(s.start_date)}{s.end_date ? ` – ${formatDate(s.end_date)}` : ''}</span>
                  </div>
                  {s.brand_category && <span className="text-xs text-gray-500">{s.brand_category}</span>}
                  {s.end_reason && <p className="text-xs text-gray-500 mt-0.5">{s.end_reason}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <AddRelationshipModal
        open={showAddRel}
        onClose={() => setShowAddRel(false)}
        clientId={client.id}
        clientControversies={client.controversies}
        onAdded={load}
      />
    </div>
  );
}
