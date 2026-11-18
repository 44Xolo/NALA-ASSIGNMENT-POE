import { Clock, Minus, Pencil, Plus, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import CourseBadge from '../components/CourseBadge';
import EmptyState from '../components/EmptyState';
import Header from '../components/Header';
import type { MenuItem } from '../types';
import { formatPrice } from '../utils/format';
import { ORDER_LIMITS } from '../utils/orderUtils';

interface Props {
  item?: MenuItem;
  inCartQty: number;
  onBack: () => void;
  onEdit: (id: string) => void;
  onAddToCart: (item: MenuItem, quantity: number) => void;
  onViewCart: () => void;
}

export default function DetailScreen({
  item,
  inCartQty,
  onBack,
  onEdit,
  onAddToCart,
  onViewCart,
}: Props) {
  const [quantity, setQuantity] = useState(1);

  if (!item) {
    return (
      <>
        <Header title="Dish" onBack={onBack} />
        <EmptyState title="Dish not found" actionLabel="Back to menu" onAction={onBack} />
      </>
    );
  }

  return (
    <>
      <Header title={item.name} onBack={onBack} />
      {item.image && <img src={item.image} alt={item.name} className="h-56 w-full object-cover" />}
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <CourseBadge course={item.course} />
          <span className="text-xl font-semibold text-nala-gold">{formatPrice(item.price)}</span>
        </div>
        <p className="text-white/80">{item.description}</p>
        {item.prepTime > 0 && (
          <p className="flex items-center gap-2 text-sm text-white/60">
            <Clock size={16} /> {item.prepTime} min prep
          </p>
        )}
        {item.ingredients.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {item.ingredients.map((ing) => (
              <span key={ing} className="rounded-full bg-nala-card px-3 py-1 text-xs text-white/80">
                {ing}
              </span>
            ))}
          </div>
        )}
        <p className={item.isAvailable ? 'text-sm text-green-400' : 'text-sm text-red-400'}>
          {item.isAvailable ? 'Available today' : 'Currently unavailable'}
        </p>

        {item.isAvailable && (
          <div className="space-y-3 rounded-2xl bg-nala-card p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/75">Quantity</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/40 text-white"
                >
                  <Minus size={16} />
                </button>
                <span className="w-8 text-center font-semibold text-white">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(ORDER_LIMITS.maxQtyPerItem, q + 1))}
                  aria-label="Increase quantity"
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/40 text-nala-gold"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onAddToCart(item, quantity)}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-nala-gold font-semibold text-black"
            >
              <ShoppingBag size={18} />
              Add to Order · {formatPrice(item.price * quantity)}
            </button>

            {inCartQty > 0 && (
              <button
                type="button"
                onClick={onViewCart}
                className="flex h-10 w-full items-center justify-center rounded-xl border border-nala-gold/40 bg-black/40 text-xs font-medium text-nala-gold"
              >
                {inCartQty} in cart · View Cart &amp; Checkout
              </button>
            )}
          </div>
        )}

        <button
          onClick={() => onEdit(item.id)}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-nala-card font-semibold text-white/85"
        >
          <Pencil size={18} /> Edit dish
        </button>
      </div>
    </>
  );
}
