import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import CourseBadge from '../components/CourseBadge';
import EmptyState from '../components/EmptyState';
import Header from '../components/Header';
import type { CartItem, OrderTotals } from '../types';
import { formatPrice } from '../utils/format';
import { ORDER_LIMITS, TIP_PERCENT_OPTIONS } from '../utils/orderUtils';

interface Props {
  items: CartItem[];
  totals: OrderTotals;
  tipPercent: number;
  onTipChange: (pct: number) => void;
  onUpdateQty: (menuItemId: string, quantity: number) => void;
  onRemove: (menuItemId: string) => void;
  onClear: () => void;
  onBrowseMenu: () => void;
  onCheckout: () => void;
}

export default function CartScreen({
  items,
  totals,
  tipPercent,
  onTipChange,
  onUpdateQty,
  onRemove,
  onClear,
  onBrowseMenu,
  onCheckout,
}: Props) {
  return (
    <>
      <Header
        title="Your Cart"
        onBack={onBrowseMenu}
        right={
          items.length > 0 ? (
            <button
              type="button"
              onClick={onClear}
              className="min-h-[44px] px-2 text-xs font-medium text-white/60 underline"
            >
              Clear
            </button>
          ) : undefined
        }
      />

      {items.length === 0 ? (
        <EmptyState
          title="Your cart is empty"
          hint="Select available dishes from the menu to start an order."
          actionLabel="Browse menu"
          onAction={onBrowseMenu}
        />
      ) : (
        <div className="space-y-4 px-4 pb-6">
          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item.menuItemId}
                className="flex items-center gap-3 rounded-2xl bg-nala-card p-3"
              >
                {item.image ? (
                  <img
                    src={item.image}
                    alt=""
                    className="h-16 w-16 shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-black/40 font-display text-xl text-nala-gold/70">
                    {item.name.charAt(0)}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <CourseBadge course={item.course} />
                  <p className="mt-1 truncate font-display text-base text-white">{item.name}</p>
                  <p className="text-xs text-white/60">{formatPrice(item.unitPrice)} each</p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span className="text-sm font-semibold text-nala-gold">
                    {formatPrice(item.unitPrice * item.quantity)}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onUpdateQty(item.menuItemId, item.quantity - 1)}
                      aria-label={`Decrease ${item.name} quantity`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/40 text-white/80"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-6 text-center text-sm font-medium text-white">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => onUpdateQty(item.menuItemId, item.quantity + 1)}
                      disabled={item.quantity >= ORDER_LIMITS.maxQtyPerItem}
                      aria-label={`Increase ${item.name} quantity`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/40 text-nala-gold disabled:opacity-40"
                    >
                      <Plus size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemove(item.menuItemId)}
                      aria-label={`Remove ${item.name}`}
                      className="ml-1 flex h-8 w-8 items-center justify-center rounded-lg bg-black/40 text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <section aria-labelledby="tip-heading" className="rounded-2xl bg-nala-card p-4">
            <h2 id="tip-heading" className="font-display text-base text-white">
              Add gratuity for kitchen &amp; service
            </h2>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {TIP_PERCENT_OPTIONS.map((pct) => {
                const active = tipPercent === pct;
                return (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => onTipChange(pct)}
                    className={`h-10 rounded-xl text-xs font-semibold transition-colors ${
                      active
                        ? 'bg-nala-gold text-black'
                        : 'border border-white/10 bg-black/40 text-white/80'
                    }`}
                  >
                    {pct === 0 ? 'None' : `${pct}%`}
                  </button>
                );
              })}
            </div>
          </section>

          <section aria-labelledby="summary-heading" className="rounded-2xl bg-nala-card p-4">
            <h2 id="summary-heading" className="mb-3 font-display text-lg text-white">
              Order summary
            </h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-white/60">Items ({totals.itemCount})</dt>
                <dd className="text-white">{formatPrice(totals.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-white/60">Service fee (5%)</dt>
                <dd className="text-white">{formatPrice(totals.serviceFee)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-white/60">Gratuity ({tipPercent}%)</dt>
                <dd className="text-white">{formatPrice(totals.tip)}</dd>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-2 text-base font-semibold">
                <dt className="text-white">Total</dt>
                <dd className="text-nala-gold" data-testid="cart-total">
                  {formatPrice(totals.total)}
                </dd>
              </div>
            </dl>
          </section>

          <button
            type="button"
            onClick={onCheckout}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-nala-gold font-semibold text-black"
          >
            <ShoppingBag size={18} />
            Proceed to Checkout · {formatPrice(totals.total)}
          </button>
        </div>
      )}
    </>
  );
}
