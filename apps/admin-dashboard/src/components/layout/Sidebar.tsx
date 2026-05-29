'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, Package, Grid3X3, BarChart3, Users, Bed, BookOpen, Warehouse, Settings, Printer, ChefHat } from 'lucide-react';
import { cn } from '@/lib/utils';

const nav = [
  { href: '/pos', label: 'POS', icon: ShoppingCart },
  { href: '/tables', label: 'Tables', icon: Grid3X3 },
  { href: '/orders', label: 'Orders', icon: ChefHat },
  { href: '/products', label: 'Products', icon: Package },
  { href: '/stock', label: 'Stock', icon: Warehouse },
  { href: '/rooms', label: 'Rooms', icon: Bed },
  { href: '/reservations', label: 'Reservations', icon: BookOpen },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/users', label: 'Users', icon: Users },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-16 lg:w-56 bg-[#2A2A3E] border-r border-[#3A3A5C] flex flex-col">
      <div className="p-4 border-b border-[#3A3A5C]">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏨</span>
          <span className="hidden lg:block font-bold text-white text-sm">SHMS</span>
        </div>
      </div>
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm',
            pathname.startsWith(href) ? 'bg-primary-500 text-white' : 'text-gray-400 hover:bg-white/10 hover:text-white'
          )}>
            <Icon size={18} className="shrink-0" />
            <span className="hidden lg:block">{label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
