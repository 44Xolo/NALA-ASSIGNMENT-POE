import { CheckCircle2, ChefHat, Clock, Receipt, Sparkles } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import Header from '../components/Header';
import type { OrderRecord, OrderStatus } from '../types';
import { formatPrice } from '../utils/format';

interface Props {
  orders: OrderRecord[];
  loading: boolean;
  canSyncFirestore: boolean;
  highlightOrderId?: string;
  onAdvanceStatus: (order: OrderRecord) => Promise<void>;
  onBrowseMenu: () => void;
}

const STATUS_STEPS: { key: OrderStatus; label: string }[] = [
  { key: 'paid', label: 'Confirmed' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready', label: 'Ready' },
  { key: 'completed', label: 'Completed' },
];

function paymentSummary(order: OrderRecord): string {
  if (order.paymentMethod === 'card') {
    return `Paid · Card •••• ${order.paymentLast4}`;
  }
  if (order.paymentMethod === 'instant-eft') {
    return `Paid · EFT (${order.paymentLast4})`;
  }
  return order.paymentStatus === 'paid' ? 'Paid at counter' : 'Pay on arrival';
}

function fulfillmentLabel(order: OrderRecord): string {
  if (order.fulfillment === 'dine-in') return `Dine-in · ${order.tableOrAddress}`;
  if (order.fulfillment === 'delivery') return `Delivery · ${order.tableOrAddress}`;
  return `Collection · ${order.tableOrAddress}`;
}

export default function OrdersScreen({
  orders,
  loading,
  canSyncFirestore,
  highlightOrderId,
  onAdvanceStatus,
  onBrowseMenu,
}: Props) {
  return (
    <>
      <Header title="Orders & Receipts" />

      <div className="space-y-4 px-4 pb-6">
        {!canSyncFirestore && (
          <p className="rounded-2xl border border-nala-gold/30 bg-nala-card p-3 text-xs text-white/75">
            Verify your email in <span className="text-nala-gold">Settings</span> to sync your order history to the cloud.
          </p>
        )}

        {loading ? (
          <p className="py-12 text-center text-sm text-white/60">Loading your orders…</p>
        ) : orders.length === 0 ? (
          <EmptyState
            title="No orders yet"
            hint="Add dishes to your cart and complete checkout to track your meal here."
            actionLabel="Order from menu"
            onAction={onBrowseMenu}
          />
        ) : (
          orders.map((order) => {
            const activeIndex = STATUS_STEPS.findIndex((s) => s.key === order.status);
            const isHighlighted = highlightOrderId === order.id;
            return (
              <article
                key={order.id}
                className={`space-y-3 rounded-2xl bg-nala-card p-4 ${
                  isHighlighted ? 'ring-1 ring-nala-gold' : ''
                }`}
              >
                {isHighlighted && (
                  <div className="flex items-center gap-2 rounded-xl bg-nala-gold/15 px-3 py-2 text-xs font-medium text-nala-gold">
                    <Sparkles size={14} />
                    Order confirmed! Sent straight to the NALA kitchen.
                  </div>
                )}

                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="flex items-center gap-1.5 font-display text-lg text-white">
                      <Receipt size={16} className="text-nala-gold" />
                      {order.orderNumber}
                    </p>
                    <p className="mt-0.5 text-xs text-white/55">
                      {new Date(order.createdAtMs).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                      order.paymentStatus === 'paid'
                        ? 'bg-green-500/15 text-green-300'
                        : 'bg-nala-gold/15 text-nala-gold'
                    }`}
                  >
                    {paymentSummary(order)}
                  </span>
                </div>

                <p className="text-xs text-white/75">
                  {order.customerName} · {fulfillmentLabel(order)}
                </p>

                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  {STATUS_STEPS.map((step, index) => {
                    const reached = index <= activeIndex;
                    return (
                      <div key={step.key} className="space-y-1 text-center">
                        <div
                          className={`h-1.5 rounded-full ${
                            reached ? 'bg-nala-gold' : 'bg-black/50'
                          }`}
                        />
                        <p
                          className={`text-[10px] ${
                            reached ? 'font-medium text-nala-gold' : 'text-white/40'
                          }`}
                        >
                          {step.label}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <ul className="space-y-1.5 border-t border-white/10 pt-3 text-sm">
                  {order.items.map((line) => (
                    <li key={`${order.id}-${line.menuItemId}`} className="flex justify-between gap-2">
                      <span className="text-white/85">
                        {line.quantity}× {line.name}
                      </span>
                      <span className="text-white/70">{formatPrice(line.lineTotal)}</span>
                    </li>
                  ))}
                </ul>

                {order.notes && (
                  <p className="rounded-xl bg-black/30 px-3 py-2 text-xs text-white/65">
                    Kitchen note: {order.notes}
                  </p>
                )}

                <div className="flex items-center justify-between border-t border-white/10 pt-2 text-sm font-semibold">
                  <span className="text-white/70">Total paid / due</span>
                  <span className="text-nala-gold">{formatPrice(order.total)}</span>
                </div>

                {order.status !== 'completed' ? (
                  <button
                    type="button"
                    onClick={() => void onAdvanceStatus(order)}
                    className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-nala-gold/40 bg-black/40 text-xs font-medium text-nala-gold"
                  >
                    {order.status === 'paid' ? (
                      <>
                        <ChefHat size={14} /> Mark as Preparing
                      </>
                    ) : order.status === 'preparing' ? (
                      <>
                        <Clock size={14} /> Mark as Ready for Guest
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={14} /> Complete Order
                      </>
                    )}
                  </button>
                ) : (
                  <p className="flex items-center justify-center gap-1.5 text-xs text-green-400">
                    <CheckCircle2 size={14} /> Order completed
                  </p>
                )}
              </article>
            );
          })
        )}
      </div>
    </>
  );
}
