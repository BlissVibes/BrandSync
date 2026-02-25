import { useState, useEffect } from 'react';
import Modal from '../shared/Modal';
import { brandsApi, relationshipsApi } from '../../services/api';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';
import { getMatchLevel } from '../../utils/categoryUtils';

export default function AddRelationshipModal({ open, onClose, clientId, clientControversies = [], onAdded }) {
  const [brands, setBrands] = useState([]);
  const [form, setForm] = useState({ brand_id: '', status: 'active', start_date: '', end_date: '', end_reason: '', end_reason_source_url: '', is_public_end: false, ended_by: 'unknown' });
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [preflightFlags, setPreflightFlags] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      brandsApi.list().then(setBrands).catch(() => {});
    }
  }, [open]);

  const handleBrandSelect = (brandId) => {
    setForm(f => ({ ...f, brand_id: brandId }));
    const brand = brands.find(b => b.id === parseInt(brandId));
    setSelectedBrand(brand || null);

    if (brand && clientControversies.length > 0) {
      const flags = clientControversies.filter(c => {
        const level = getMatchLevel(c.relevance_to_brands || [], brand.categories || []);
        return level !== null;
      });
      setPreflightFlags(flags);
    } else {
      setPreflightFlags([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.brand_id) return;
    setLoading(true);
    try {
      await relationshipsApi.create({ ...form, client_id: clientId, brand_id: parseInt(form.brand_id) });
      toast.success('Brand partnership added');
      onAdded?.();
      onClose();
      setForm({ brand_id: '', status: 'active', start_date: '', end_date: '', end_reason: '', end_reason_source_url: '', is_public_end: false, ended_by: 'unknown' });
      setPreflightFlags([]);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  return (
    <Modal open={open} onClose={onClose} title="Add Brand Partnership">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Brand *</label>
          <select className="select" value={form.brand_id} onChange={(e) => handleBrandSelect(e.target.value)} required>
            <option value="">Select a brand...</option>
            {brands.map(b => (
              <option key={b.id} value={b.id}>{b.name} — {b.primary_category}</option>
            ))}
          </select>
        </div>

        {preflightFlags.length > 0 && (
          <div className="rounded-lg border border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/10 p-3">
            <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400 font-semibold text-sm mb-2">
              <AlertTriangle className="w-4 h-4" />
              Pre-flight controversy check: {preflightFlags.length} flag{preflightFlags.length !== 1 ? 's' : ''}
            </div>
            {preflightFlags.map(f => (
              <div key={f.id} className="text-xs text-orange-700 dark:text-orange-400 mt-1">
                <span className="font-medium uppercase text-xs">{f.severity}</span> — {f.title}
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Status</label>
            <select className="select" value={form.status} onChange={set('status')}>
              <option value="active">Active</option>
              <option value="ended">Ended</option>
            </select>
          </div>
          <div>
            <label className="label">Start Date</label>
            <input type="date" className="input" value={form.start_date} onChange={set('start_date')} />
          </div>
        </div>

        {form.status === 'ended' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">End Date</label>
                <input type="date" className="input" value={form.end_date} onChange={set('end_date')} />
              </div>
              <div>
                <label className="label">Ended By</label>
                <select className="select" value={form.ended_by} onChange={set('ended_by')}>
                  <option value="client">Client</option>
                  <option value="brand">Brand</option>
                  <option value="mutual">Mutual</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">End Reason</label>
              <textarea className="input resize-none" rows={2} value={form.end_reason} onChange={set('end_reason')} />
            </div>
            <div>
              <label className="label">Source URL</label>
              <input className="input" value={form.end_reason_source_url} onChange={set('end_reason_source_url')} placeholder="https://..." />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="is_public_end" checked={form.is_public_end} onChange={set('is_public_end')} className="rounded" />
              <label htmlFor="is_public_end" className="text-sm text-gray-700 dark:text-gray-300">Publicly ended partnership</label>
            </div>
          </>
        )}

        <div className="flex gap-3 justify-end pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Adding...' : 'Add Partnership'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
