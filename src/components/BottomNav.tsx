import { BarChart3, Home, ListChecks, Receipt, Settings, ShoppingBag } from 'lucide-react';
import type { Screen } from '../types';

interface Props {
  current: Screen['name'];
  cartCount?: number;
  onNavigate: (screen: Screen) => void;
}

const TABS = [
  { label: 'Menu', icon: Home, target: { name: 'home' } as Screen, match: ['home', 'detail'] },
  { label: 'Cart', icon: ShoppingBag, target: { name: 'cart' } as Screen, match: ['cart', 'checkout'], badge: true },
  { label: 'Orders', icon: Receipt, target: { name: 'orders' } as Screen, match: ['orders'] },
  { label: 'Manage', icon: ListChecks, target: { name: 'manage' } as Screen, match: ['manage', 'edit', 'add'] },
  { label: 'Stats', icon: BarChart3, target: { name: 'stats' } as Screen, match: ['stats'] },
  { label: 'Settings', icon: Settings, target: { name: 'settings' } as Screen, match: ['settings'] },
];

export default function BottomNav({ current, cartCount = 0, onNavigate }: Props) {
  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 left-1/2 z-20 flex w-full max-w-md -translate-x-1/2 border-t border-white/10 bg-nala-bg"
    >
      {TABS.map(({ label, icon: Icon, target, match, badge }) => {
        const active = match.includes(current);
        return (
          <button
            key={label}
            onClick={() => onNavigate(target)}
            aria-current={active ? 'page' : undefined}
            className={`relative flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 text-[11px] ${
              active ? 'text-nala-gold' : 'text-white/60'
            }`}
          >
            <div className="relative">
              <Icon size={18} />
              {badge && cartCount > 0 && (
                <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-nala-gold px-1 text-[10px] font-bold text-black">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </div>
            {label}
          </button>
        );
      })}
    </nav>
  );
}
