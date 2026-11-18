import { Minus, Plus, ShoppingBag } from 'lucide-react';
import type { MenuItem } from '../types';
import { formatPrice } from '../utils/format';
import CourseBadge from './CourseBadge';

interface Props {
  item: MenuItem;
  cartQuantity?: number;
  onOpen: (id: string) => void;
  onAddToCart?: (item: MenuItem) => void;
  onUpdateCartQty?: (menuItemId: string, quantity: number) => void;
}

export default function MenuCard({
  item,
  cartQuantity = 0,
  onOpen,
  onAddToCart,
  onUpdateCartQty,
}: Props) {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl bg-nala-card text-left">
      <button
        type="button"
        onClick={() => onOpen(item.id)}
        className="flex-1 text-left"
        aria-label={`${item.name}, ${formatPrice(item.price)}`}
      >
        {item.image ? (
          <img src={item.image} alt="" className="h-28 w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-28 w-full items-center justify-center bg-black/40 font-display text-3xl text-nala-gold/60">
            {item.name.charAt(0)}
          </div>
        )}
        <div className="space-y-2 p-3 pb-2">
          <CourseBadge course={item.course} />
          <h3 className="font-display text-base leading-tight text-white">{item.name}</h3>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-nala-gold">{formatPrice(item.price)}</span>
            {!item.isAvailable && <span className="text-xs text-red-400">Unavailable</span>}
          </div>
        </div>
      </button>

      {onAddToCart && onUpdateCartQty && (
        <div className="px-3 pb-3 pt-1">
          {!item.isAvailable ? (
            <span className="block w-full rounded-lg bg-black/30 py-1.5 text-center text-[11px] text-white/40">
              Sold out
            </span>
          ) : cartQuantity > 0 ? (
            <div className="flex h-9 items-center justify-between rounded-lg border border-nala-gold/40 bg-black/40 px-1.5">
              <button
                type="button"
                onClick={() => onUpdateCartQty(item.id, cartQuantity - 1)}
                aria-label={`Remove one ${item.name}`}
                className="flex h-7 w-7 items-center justify-center rounded-md text-white/80"
              >
                <Minus size={14} />
              </button>
              <span className="text-xs font-semibold text-nala-gold">{cartQuantity} in cart</span>
              <button
                type="button"
                onClick={() => onUpdateCartQty(item.id, cartQuantity + 1)}
                aria-label={`Add one more ${item.name}`}
                className="flex h-7 w-7 items-center justify-center rounded-md text-nala-gold"
              >
                <Plus size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onAddToCart(item)}
              className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-nala-gold/15 text-xs font-semibold text-nala-gold ring-1 ring-nala-gold/35 transition-colors hover:bg-nala-gold hover:text-black"
            >
              <ShoppingBag size={13} />
              Order
            </button>
          )}
        </div>
      )}
    </article>
  );
}
