'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Star, X, Tag } from 'lucide-react';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';

const emptyProduct = { name: '', categoryId: '', sellPrice: '', costPrice: '', vatRate: '0', sku: '', trackStock: true, isFavorite: false, printerId: '' };
const emptyCategory = { name: '', icon: '📦', color: '#6366F1' };

export default function ProductsPage() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const canManage = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const [tab, setTab] = useState<'products' | 'categories'>('products');
  const [modal, setModal] = useState(false);
  const [catModal, setCatModal] = useState(false);
  const [form, setForm] = useState<any>(emptyProduct);
  const [catForm, setCatForm] = useState<any>(emptyCategory);
  const [editing, setEditing] = useState<string | null>(null);
  const [editingCat, setEditingCat] = useState<string | null>(null);

  const { data: products = [] } = useQuery({ queryKey: ['products'], queryFn: () => api.get('/products') });
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: () => api.get('/categories') });
  const { data: printers = [] } = useQuery({ queryKey: ['printers'], queryFn: () => api.get('/printers') });

  const saveProduct = useMutation({
    mutationFn: (data: any) => editing ? api.put(`/products/${editing}`, data) : api.post('/products', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); setModal(false); setForm(emptyProduct); setEditing(null); toast.success('Saved!'); },
    onError: () => toast.error('Failed to save'),
  });

  const removeProduct = useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });

  const toggleFav = useMutation({
    mutationFn: ({ id, isFavorite }: any) => api.put(`/products/${id}/favorite`, { isFavorite }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });

  const saveCategory = useMutation({
    mutationFn: (data: any) => editingCat ? api.put(`/categories/${editingCat}`, data) : api.post('/categories', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); setCatModal(false); setCatForm(emptyCategory); setEditingCat(null); toast.success('Category saved!'); },
    onError: () => toast.error('Failed to save category'),
  });

  const removeCategory = useMutation({
    mutationFn: (id: string) => api.delete(`/categories/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
    onError: () => toast.error('Cannot delete category with products'),
  });

  const openEditProduct = (p: any) => {
    setForm({ name: p.name, categoryId: p.categoryId, sellPrice: p.sellPrice, costPrice: p.costPrice, vatRate: p.vatRate, sku: p.sku || '', trackStock: p.trackStock, isFavorite: p.isFavorite, printerId: p.printerId || '' });
    setEditing(p.id);
    setModal(true);
  };

  const openEditCategory = (c: any) => {
    setCatForm({ name: c.name, icon: c.icon || '📦', color: c.color || '#6366F1' });
    setEditingCat(c.id);
    setCatModal(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Products</h1>
          <div className="flex bg-[#2A2A3E] rounded-lg p-1">
            <button onClick={() => setTab('products')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'products' ? 'bg-primary-500 text-white' : 'text-gray-400 hover:text-white'}`}>
              Products
            </button>
            <button onClick={() => setTab('categories')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${tab === 'categories' ? 'bg-primary-500 text-white' : 'text-gray-400 hover:text-white'}`}>
              <Tag size={14} /> Categories
            </button>
          </div>
        </div>
        {canManage && (
          <button onClick={() => { if (tab === 'products') { setForm(emptyProduct); setEditing(null); setModal(true); } else { setCatForm(emptyCategory); setEditingCat(null); setCatModal(true); } }}
            className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Add {tab === 'products' ? 'Product' : 'Category'}
          </button>
        )}
      </div>

      {/* Products Tab */}
      {tab === 'products' && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-[#3A3A5C] text-gray-400 text-left">
              <th className="pb-3 pr-4">Product</th><th className="pb-3 pr-4">Category</th><th className="pb-3 pr-4">Price</th><th className="pb-3 pr-4">Cost</th><th className="pb-3 pr-4">Stock</th><th className="pb-3">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-[#3A3A5C]">
              {(products as any[]).map((p: any) => (
                <tr key={p.id} className="text-gray-300 hover:bg-white/5">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{p.category?.icon || '📦'}</span>
                      <div>
                        <p className="font-medium text-white">{p.name}</p>
                        {p.sku && <p className="text-xs text-gray-500">SKU: {p.sku}</p>}
                      </div>
                      {p.isFavorite && <Star size={12} className="text-yellow-400 fill-yellow-400" />}
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-gray-400">{p.category?.name}</td>
                  <td className="py-3 pr-4 text-primary-500 font-medium">{formatCurrency(p.sellPrice)}</td>
                  <td className="py-3 pr-4 text-gray-400">{formatCurrency(p.costPrice)}</td>
                  <td className="py-3 pr-4">
                    {p.stock ? <span className={p.stock.quantity <= p.stock.minQuantity ? 'text-red-400' : 'text-green-400'}>{p.stock.quantity} {p.stock.unit}</span> : <span className="text-gray-500">—</span>}
                  </td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <button onClick={() => toggleFav.mutate({ id: p.id, isFavorite: !p.isFavorite })} className="text-gray-500 hover:text-yellow-400 transition-colors">
                        <Star size={14} className={p.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''} />
                      </button>
                      {canManage && <button onClick={() => openEditProduct(p)} className="text-gray-500 hover:text-primary-500 transition-colors"><Edit2 size={14} /></button>}
                      {canManage && <button onClick={() => removeProduct.mutate(p.id)} className="text-gray-500 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
              {(products as any[]).length === 0 && (
                <tr><td colSpan={6} className="py-12 text-center text-gray-500">No products yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Categories Tab */}
      {tab === 'categories' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {(categories as any[]).map((c: any) => (
            <div key={c.id} className="card text-center group relative">
              <div className="text-4xl mb-2">{c.icon}</div>
              <p className="font-medium text-white">{c.name}</p>
              <div className="w-3 h-3 rounded-full mx-auto mt-2" style={{ background: c.color || '#6366F1' }} />
              {canManage && (
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEditCategory(c)} className="w-6 h-6 bg-[#1E1E2E] rounded flex items-center justify-center text-gray-400 hover:text-primary-500"><Edit2 size={11} /></button>
                  <button onClick={() => removeCategory.mutate(c.id)} className="w-6 h-6 bg-[#1E1E2E] rounded flex items-center justify-center text-gray-400 hover:text-red-400"><Trash2 size={11} /></button>
                </div>
              )}
            </div>
          ))}
          {(categories as any[]).length === 0 && <p className="col-span-5 text-center text-gray-500 py-12">No categories yet</p>}
        </div>
      )}

      {/* Product Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="card w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{editing ? 'Edit' : 'Add'} Product</h2>
              <button onClick={() => setModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); saveProduct.mutate({ ...form, sellPrice: +form.sellPrice, costPrice: +form.costPrice, vatRate: +form.vatRate }); }} className="space-y-3">
              <div><label className="text-xs text-gray-400">Name *</label><input className="input mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              <div><label className="text-xs text-gray-400">Category *</label>
                <select className="input mt-1" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} required>
                  <option value="">Select category</option>
                  {(categories as any[]).map((c: any) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-gray-400">Sell Price *</label><input className="input mt-1" type="number" value={form.sellPrice} onChange={(e) => setForm({ ...form, sellPrice: e.target.value })} required /></div>
                <div><label className="text-xs text-gray-400">Cost Price</label><input className="input mt-1" type="number" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-gray-400">VAT %</label><input className="input mt-1" type="number" value={form.vatRate} onChange={(e) => setForm({ ...form, vatRate: e.target.value })} /></div>
                <div><label className="text-xs text-gray-400">SKU</label><input className="input mt-1" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></div>
              </div>
              <div><label className="text-xs text-gray-400">Printer</label>
                <select className="input mt-1" value={form.printerId} onChange={(e) => setForm({ ...form, printerId: e.target.value })}>
                  <option value="">No printer assigned</option>
                  {(printers as any[]).map((p: any) => <option key={p.id} value={p.id}>{p.name} ({p.type})</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="trackStock" checked={form.trackStock} onChange={(e) => setForm({ ...form, trackStock: e.target.checked })} />
                <label htmlFor="trackStock" className="text-sm text-gray-300">Track Stock</label>
              </div>
              <button type="submit" disabled={saveProduct.isPending} className="btn-primary w-full py-2.5">{saveProduct.isPending ? 'Saving...' : 'Save Product'}</button>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {catModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="card w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{editingCat ? 'Edit' : 'Add'} Category</h2>
              <button onClick={() => setCatModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); saveCategory.mutate(catForm); }} className="space-y-3">
              <div><label className="text-xs text-gray-400">Name *</label><input className="input mt-1" value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} required /></div>
              <div><label className="text-xs text-gray-400">Icon (emoji)</label><input className="input mt-1" value={catForm.icon} onChange={(e) => setCatForm({ ...catForm, icon: e.target.value })} placeholder="e.g. 🍺" /></div>
              <div>
                <label className="text-xs text-gray-400">Color</label>
                <div className="flex items-center gap-2 mt-1">
                  <input type="color" value={catForm.color} onChange={(e) => setCatForm({ ...catForm, color: e.target.value })} className="w-10 h-10 rounded cursor-pointer bg-transparent border-0" />
                  <input className="input flex-1" value={catForm.color} onChange={(e) => setCatForm({ ...catForm, color: e.target.value })} placeholder="#6366F1" />
                </div>
              </div>
              <button type="submit" disabled={saveCategory.isPending} className="btn-primary w-full py-2.5">{saveCategory.isPending ? 'Saving...' : 'Save Category'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
