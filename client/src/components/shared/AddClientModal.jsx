import { useState } from 'react';
import Modal from './Modal';
import { clientsApi, seoApi } from '../../services/api';
import { toast } from 'sonner';

export default function AddClientModal({ open, onClose, onAdded }) {
  const [form, setForm] = useState({ name: '', display_name: '', category: '', platform: 'Both', org: '', notes: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setLoading(true);
    try {
      const client = await clientsApi.create({ ...form });
      // Seed SEO data
      await seoApi.seedEntity({ entity_id: client.id, entity_type: 'client', name: client.name }).catch(() => {});
      toast.success(`${client.name} added to dashboard`);
      onAdded?.(client);
      onClose();
      setForm({ name: '', display_name: '', category: '', platform: 'Both', org: '', notes: '' });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <Modal open={open} onClose={onClose} title="Add New Client">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Handle / Username *</label>
          <input className="input" value={form.name} onChange={set('name')} placeholder="e.g. Pokimane" required />
        </div>
        <div>
          <label className="label">Display Name</label>
          <input className="input" value={form.display_name} onChange={set('display_name')} placeholder="e.g. Pokimane (Imane Anys)" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Platform</label>
            <select className="select" value={form.platform} onChange={set('platform')}>
              <option value="Twitch">Twitch</option>
              <option value="YouTube">YouTube</option>
              <option value="Both">Both</option>
            </select>
          </div>
          <div>
            <label className="label">Category / Niche</label>
            <input className="input" value={form.category} onChange={set('category')} placeholder="e.g. Gaming/Lifestyle" />
          </div>
        </div>
        <div>
          <label className="label">Organization / Agency</label>
          <input className="input" value={form.org} onChange={set('org')} placeholder="e.g. 100 Thieves" />
        </div>
        <div>
          <label className="label">Notes</label>
          <textarea className="input resize-none" rows={3} value={form.notes} onChange={set('notes')} placeholder="Add any relevant notes..." />
        </div>
        <div className="flex gap-3 justify-end pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Adding...' : 'Add Client'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
