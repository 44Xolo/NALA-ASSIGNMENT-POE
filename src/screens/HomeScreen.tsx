import { ArrowRight, LogOut, ShoppingBag } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import Header from '../components/Header';
import MenuCard from '../components/MenuCard';
import SearchFilterBar from '../components/SearchFilterBar';
import { useMenuFilters } from '../hooks/useMenuFilters';
import type { MenuItem } from '../types';
import { formatPrice } from '../utils/format';

interface Props {
  items: MenuItem[];
  userName: string;
  userTitle?: string;
  cartCount: number;
  cartSubtotal: number;
  getCartQty: (menuItemId: string) => number;
  onAddToCart: (item: MenuItem) => void;
  onUpdateCartQty: (menuItemId: string, quantity: number) => void;
  onOpenCart: () => void;
  onOpen: (id: string) => void;
  onAdd: () => void;
  onSignOut: () => void;
}

export default function HomeScreen({
  items,
  userName,
  userTitle,
  cartCount,
  cartSubtotal,
  getCartQty,
  onAddToCart,
  onUpdateCartQty,
  onOpenCart,
  onOpen,
  onAdd,
  onSignOut,
}: Props) {
  const f = useMenuFilters(items);
  return (
    <>
      <Header
        title="NALA"
        right={
          <button
            onClick={onSignOut}
            aria-label="Sign out"
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-nala-card text-white/70"
          >
            <LogOut size={18} />
          </button>
        }
      />
      <div className="px-4 pb-3">
        <p className="text-white/70">
          Welcome back, <span className="text-white">{userName}</span>
        </p>
        {userTitle && <p className="mt-0.5 text-xs text-nala-gold/85">{userTitle}</p>}
      </div>
      <SearchFilterBar
        query={f.query}
        course={f.course}
        isFiltering={f.isFiltering}
        resultCount={f.filtered.length}
        onQueryChange={f.setQuery}
        onCourseChange={f.setCourse}
        onClear={f.clear}
      />
      {items.length === 0 ? (
        <EmptyState
          title="Your menu is empty"
          hint="Add your first dish to get started."
          actionLabel="Add a dish"
          onAction={onAdd}
        />
      ) : f.filtered.length === 0 ? (
        <EmptyState
          title="No dishes found"
          hint="Try a different name or course."
          actionLabel="Clear search & filter"
          onAction={f.clear}
        />
      ) : (
        <div className={`grid grid-cols-2 gap-3 px-4 ${cartCount > 0 ? 'pb-16' : ''}`}>
          {f.filtered.map((item) => (
            <MenuCard
              key={item.id}
              item={item}
              cartQuantity={getCartQty(item.id)}
              onOpen={onOpen}
              onAddToCart={onAddToCart}
              onUpdateCartQty={onUpdateCartQty}
            />
          ))}
        </div>
      )}

      {cartCount > 0 && (
        <div className="fixed bottom-16 left-1/2 z-10 w-full max-w-md -translate-x-1/2 px-4">
          <button
            type="button"
            onClick={onOpenCart}
            className="flex h-12 w-full items-center justify-between rounded-xl bg-nala-gold px-4 text-sm font-semibold text-black shadow-lg"
          >
            <span className="flex items-center gap-2">
              <ShoppingBag size={17} />
              {cartCount} {cartCount === 1 ? 'dish' : 'dishes'} · {formatPrice(cartSubtotal)}
            </span>
            <span className="flex items-center gap-1">
              View Cart <ArrowRight size={16} />
            </span>
          </button>
        </div>
      )}
    </>
  );
}
