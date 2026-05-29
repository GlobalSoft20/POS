'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, Smartphone, X } from 'lucide-react';
import api from '@/lib/api';
import { usePOSStore } from '@/store/pos.store';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function POSPage() {
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('');
  const [payModal, setPayModal] = useState(false);
  const [payMethod, setPayMethod] = useState('CASH');
  const qc = useQueryClient();
  const { items, addItem, removeItem, updateQty, tableId, setTable, discount, setDiscount, clear, subtotal, total } = usePOSStore();

  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: () => api.get('/categories') });
  const { data: products = [] } = useQuery({
    queryKey: ['products', activeCat, search],
    queryFn: () => api.get(`/products?${activeCat ? `categoryId=${activeCat}&` : ''}${search ? `search=${search}` : ''}`),
  });
  const { data: tables = [] } = useQuery({ queryKey: ['tables'], queryFn: () => api.get('/tables') });

  const createOrder = useMutation({
    mutationFn: (data: any) => api.post('/orders', data),
    onSuccess: (order: any) => {
      payOrder.mutate({ id: order.id, payments: [{ method: payMethod, amount: total() }] });
    },
  });

  const payOrder = useMutation({
    mutationFn: ({ id, payments }: any) => api.post(`/orders/${id}/pay`, { payments }),
    onSuccess: () => {
      toast.success('Order completed!');
      clear();
      setPayModal(false);
      qc.invalidateQueries({ queryKey: ['tables'] });
    },
    onError: () => toast.error('Payment failed'),
  });

  const handleCheckout = () => {
    if (!items.length) return toast.error('Cart is empty');
    setPayModal(true);
  };

  const handlePay = () => {
    createOrder.mutate({
      tableId: tableId || undefined,
      discount,
      items: items.map((i) => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.price, notes: i.notes })),
    });
  };

  return (
    <div className="flex h-full gap-4 -m-6 p-4">
      {/* Left: Products */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Search products or scan barcode..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button onClick={() => setActiveCat('')} className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${!activeCat ? 'bg-primary-500 text-white' : 'bg-[#2A2A3E] text-gray-400 hover:text-white'}`}>
            All
          </button>
          {(categories as any[]).map((c: any) => (
            <button key={c.id} onClick={() => setActiveCat(c.id)} className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeCat === c.id ? 'bg-primary-500 text-white' : 'bg-[#2A2A3E] text-gray-400 hover:text-white'}`}>
              {c.icon} {c.name}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 overflow-y-auto flex-1">
          {(products as any[]).map((p: any) => (
            <button key={p.id} onClick={() => addItem({ productId: p.id, name: p.name, price: p.sellPrice, printerId: p.printerId })}
              className="card hover:border-primary-500 transition-all text-left group active:scale-95">
              <div className="aspect-square bg-[#1E1E2E] rounded-lg mb-2 flex items-center justify-center text-3xl">
                {p.category?.icon || '📦'}
              </div>
              <p className="text-sm font-medium text-white truncate">{p.name}</p>
              <p className="text-primary-500 font-bold text-sm mt-0.5">{formatCurrency(p.sellPrice)}</p>
              {p.stock && <p className={`text-xs mt-0.5 ${p.stock.quantity <= p.stock.minQuantity ? 'text-red-400' : 'text-gray-500'}`}>Stock: {p.stock.quantity}</p>}
            </button>
          ))}
        </div>
      </div>

      {/* Right: Cart */}
      <div className="w-80 flex flex-col gap-3">
        {/* Table selector */}
        <select className="input" value={tableId || ''} onChange={(e) => setTable(e.target.value || null)}>
          <option value="">Takeaway / No Table</option>
          {(tables as any[]).map((t: any) => (
            <option key={t.id} value={t.id}>{t.name || t.number} — {t.status}</option>
          ))}
        </select>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {items.length === 0 && (
            <div className="text-center text-gray-500 py-12">
              <ShoppingCartIcon />
              <p className="mt-2 text-sm">Cart is empty</p>
            </div>
          )}
          {items.map((item) => (
            <div key={item.productId} className="card flex items-center gap-2 p-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{item.name}</p>
                <p className="text-primary-500 text-sm">{formatCurrency(item.price)}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => updateQty(item.productId, item.quantity - 1)} className="w-6 h-6 rounded bg-[#1E1E2E] flex items-center justify-center hover:bg-primary-500 transition-colors">
                  <Minus size={12} />
                </button>
                <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                <button onClick={() => updateQty(item.productId, item.quantity + 1)} className="w-6 h-6 rounded bg-[#1E1E2E] flex items-center justify-center hover:bg-primary-500 transition-colors">
                  <Plus size={12} />
                </button>
              </div>
              <p className="text-sm font-bold w-16 text-right">{formatCurrency(item.price * item.quantity)}</p>
              <button onClick={() => removeItem(item.productId)} className="text-gray-500 hover:text-red-400 transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="card space-y-2">
          <div className="flex justify-between text-sm text-gray-400">
            <span>Subtotal</span><span>{formatCurrency(subtotal())}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Discount</span>
            <input type="number" className="input py-1 text-sm" value={discount} onChange={(e) => setDiscount(+e.target.value)} min={0} />
          </div>
          <div className="flex justify-between font-bold text-lg border-t border-[#3A3A5C] pt-2">
            <span>Total</span><span className="text-primary-500">{formatCurrency(total())}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={clear} className="btn-ghost flex-1 py-2 text-sm border border-[#3A3A5C]">Clear</button>
            <button onClick={handleCheckout} className="btn-primary flex-1 py-2 text-sm">Checkout</button>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {payModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="card w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Payment</h2>
              <button onClick={() => setPayModal(false)}><X size={20} /></button>
            </div>
            <p className="text-3xl font-bold text-primary-500 text-center mb-6">{formatCurrency(total())}</p>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {[
                { method: 'CASH', label: 'Cash', icon: <Banknote size={20} /> },
                { method: 'CARD', label: 'Card', icon: <CreditCard size={20} /> },
                { method: 'MTN_MOMO', label: 'MTN MoMo', icon: <Smartphone size={20} /> },
                { method: 'AIRTEL_MONEY', label: 'Airtel', icon: <Smartphone size={20} /> },
              ].map(({ method, label, icon }) => (
                <button key={method} onClick={() => setPayMethod(method)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-colors ${payMethod === method ? 'border-primary-500 bg-primary-500/20 text-primary-500' : 'border-[#3A3A5C] text-gray-400 hover:border-primary-500'}`}>
                  {icon}<span className="text-xs font-medium">{label}</span>
                </button>
              ))}
            </div>
            <button onClick={handlePay} disabled={createOrder.isPending || payOrder.isPending} className="btn-primary w-full py-3 text-base font-bold">
              {createOrder.isPending || payOrder.isPending ? 'Processing...' : `Pay ${formatCurrency(total())}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ShoppingCartIcon() {
  return (
    <svg className="mx-auto w-12 h-12 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}
