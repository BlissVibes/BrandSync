import { useState, useEffect } from 'react';
import Modal from './Modal';
import { brandsApi, seoApi } from '../../services/api';
import { toast } from 'sonner';
import { X } from 'lucide-react';

const ALL_SUBCATEGORIES = [
  'Meal Kits','Food Delivery','Snacks & Food','Restaurants','Grocery','Beverages',
  'Skincare','Makeup','Health & Beauty','Personal Care','Haircare','Fragrance',
  'Gaming Peripherals','Gaming Chairs','Game Publishers','Esports','Streaming Tools',
  'Software','Hardware','Streaming Platforms','Apps','E-Commerce','Subscription Services',
  'Clothing','Fitness','Home Goods','Athleisure','Travel',
  'Supplements','Wellness','Health & Wellness','Energy Drinks',
  'Accessories','Luxury Goods',
  'Financial Services','Crypto','Investing','Banking',
  'Media','Music','Film','Events',
];

export default function AddBrandModal({ open, onClose, onAdded }) {
  const [form, setForm] = useState({ name: '', logo_url: '', categories: [], primary_category: '' });
  const [catInput, setCatInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (catInput.length > 0) {
      setSuggestions(ALL_SUBCATEGORIES.filter(c =>
        c.toLowerCase().includes(catInput.toLowerCase()) && !form.categories.includes(c)
      ).slice(0, 8));
    } else {
      setSuggestions([]);
    }
  }, [catInput, form.categories]);

  const addCategory = (cat) => {
    if (!form.categories.includes(cat)) {
      setForm(f => ({
        ...f,
        categories: [...f.categories, cat],
        primary_category: f.primary_category || cat,
      }));
    }
    setCatInput('');
    setSuggestions([]);
  };

  const removeCategory = (cat) => {
    setForm(f => ({
      ...f,
      categories: f.categories.filter(c => c !== cat),
      primary_category: f.primary_category === cat ? (f.categories.filter(c => c !== cat)[0] || '') : f.primary_category,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setLoading(true);
    try {
      const brand = await brandsApi.create(form);
      await seoApi.seedEntity({ entity_id: brand.id, entity_type: 'brand', name: brand.name }).catch(() => {});
      toast.success(`${brand.name} added`);
      onAdded?.(brand);
      onClose();
      setForm({ name: '', logo_url: '', categories: [], primary_category: '' });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <Modal open={open} onClose={onClose} title="Add New Brand">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Brand Name *</label>
          <input className="input" value={form.name} onChange={set('name')} placeholder="e.g. HelloFresh" required />
        </div>
        <div>
          <label className="label">Logo URL</label>
          <input className="input" value={form.logo_url} onChange={set('logo_url')} placeholder="https://..." />
        </div>
        <div>
          <label className="label">Product Categories</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {form.categories.map(cat => (
              <span key={cat} className="inline-flex items-center gap-1 bg-brand-100 dark:bg-brand-900/30 text-brand-800 dark:text-brand-300 text-xs px-2 py-1 rounded-full">
                {cat}
                <button type="button" onClick={() => removeCategory(cat)}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="relative">
            <input
              className="input"
              value={catInput}
              onChange={(e) => setCatInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (catInput) addCategory(catInput); } }}
              placeholder="Type to search or add category..."
            />
            {suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 card shadow-lg max-h-48 overflow-y-auto">
                {suggestions.map(s => (
                  <button
                    key={s}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                    onClick={() => addCategory(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1">Press Enter or click to add. Parent categories are auto-derived.</p>
        </div>
        {form.categories.length > 0 && (
          <div>
            <label className="label">Primary Category</label>
            <select className="select" value={form.primary_category} onChange={set('primary_category')}>
              {form.categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}
        <div className="flex gap-3 justify-end pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Adding...' : 'Add Brand'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
