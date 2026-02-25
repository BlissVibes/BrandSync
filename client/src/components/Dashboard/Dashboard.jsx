import { useState, useEffect } from 'react';
import { Plus, Search, Users, Grid, List, RefreshCw } from 'lucide-react';
import ClientCard from './ClientCard';
import ClientDetail from './ClientDetail';
import AddClientModal from '../shared/AddClientModal';
import { CardSkeleton } from '../shared/Skeleton';
import EmptyState from '../shared/EmptyState';
import { clientsApi, brandsApi } from '../../services/api';
import { toast } from 'sonner';

export default function Dashboard() {
  const [clients, setClients] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [showAddClient, setShowAddClient] = useState(false);
  const [viewMode, setViewMode] = useState('grid');

  const loadData = async () => {
    setLoading(true);
    try {
      const [c, b] = await Promise.all([clientsApi.list(), brandsApi.list()]);
      setClients(c);
      setBrands(b);
    } catch (err) {
      toast.error('Failed to load data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.display_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.org || '').toLowerCase().includes(search.toLowerCase())
  );

  if (selectedClientId) {
    return (
      <ClientDetail
        clientId={selectedClientId}
        onBack={() => setSelectedClientId(null)}
        allBrands={brands}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">My Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {clients.length} client{clients.length !== 1 ? 's' : ''} · {brands.length} brand{brands.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost" onClick={loadData}>
            <RefreshCw className="w-4 h-4" />
          </button>
          <button className="btn-primary" onClick={() => setShowAddClient(true)}>
            <Plus className="w-4 h-4" />
            Add Client
          </button>
        </div>
      </div>

      {/* Search + view toggle */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Search clients..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <button className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100 dark:bg-gray-800' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`} onClick={() => setViewMode('grid')}>
            <Grid className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          <button className={`p-2 ${viewMode === 'list' ? 'bg-gray-100 dark:bg-gray-800' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`} onClick={() => setViewMode('list')}>
            <List className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Client grid */}
      {loading ? (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
          {[1, 2, 3].map(i => <CardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search ? 'No matching clients' : 'No clients yet'}
          description={search ? 'Try a different search term' : 'Add your first client to get started'}
          action={!search && (
            <button className="btn-primary" onClick={() => setShowAddClient(true)}>
              <Plus className="w-4 h-4" />
              Add Client
            </button>
          )}
        />
      ) : (
        <div className={viewMode === 'grid'
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
          : 'space-y-3'
        }>
          {filtered.map(client => (
            <ClientCard
              key={client.id}
              client={client}
              onClick={() => setSelectedClientId(client.id)}
            />
          ))}
        </div>
      )}

      <AddClientModal
        open={showAddClient}
        onClose={() => setShowAddClient(false)}
        onAdded={(c) => setClients(prev => [...prev, c])}
      />
    </div>
  );
}
