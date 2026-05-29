import { create } from 'zustand';

interface CartItem { productId: string; name: string; price: number; quantity: number; notes?: string; printerId?: string; }
interface POSState {
  items: CartItem[];
  tableId: string | null;
  discount: number;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  setTable: (id: string | null) => void;
  setDiscount: (d: number) => void;
  clear: () => void;
  subtotal: () => number;
  total: () => number;
}

export const usePOSStore = create<POSState>((set, get) => ({
  items: [],
  tableId: null,
  discount: 0,
  addItem: (item) => set((s) => {
    const existing = s.items.find((i) => i.productId === item.productId);
    if (existing) return { items: s.items.map((i) => i.productId === item.productId ? { ...i, quantity: i.quantity + 1 } : i) };
    return { items: [...s.items, { ...item, quantity: 1 }] };
  }),
  removeItem: (productId) => set((s) => ({ items: s.items.filter((i) => i.productId !== productId) })),
  updateQty: (productId, qty) => set((s) => ({
    items: qty <= 0 ? s.items.filter((i) => i.productId !== productId) : s.items.map((i) => i.productId === productId ? { ...i, quantity: qty } : i),
  })),
  setTable: (id) => set({ tableId: id }),
  setDiscount: (d) => set({ discount: d }),
  clear: () => set({ items: [], tableId: null, discount: 0 }),
  subtotal: () => get().items.reduce((s, i) => s + i.price * i.quantity, 0),
  total: () => get().subtotal() - get().discount,
}));
