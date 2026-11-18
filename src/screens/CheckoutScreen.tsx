import { Banknote, CreditCard, Landmark, Lock, MapPin, Store, UtensilsCrossed } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import FormField from '../components/FormField';
import Header from '../components/Header';
import type { FulfillmentMode, OrderTotals, PaymentMethod } from '../types';
import { formatPrice } from '../utils/format';
import {
  detectCardBrand,
  EFT_BANKS,
  formatCardExpiryInput,
  formatCardNumberInput,
  ORDER_LIMITS,
  validateCheckoutForm,
  type CheckoutFormErrors,
  type CheckoutFormValues,
} from '../utils/orderUtils';

interface Props {
  totals: OrderTotals;
  defaultName: string;
  defaultPhone: string;
  submitting: boolean;
  onBack: () => void;
  onPlaceOrder: (values: CheckoutFormValues) => Promise<void>;
  onInvalid: () => void;
}

const inputClass = (hasError: boolean) =>
  `h-12 w-full rounded-xl bg-black/40 px-3 text-white placeholder-white/40 outline-none focus:ring-1 ${
    hasError ? 'ring-1 ring-red-400' : 'focus:ring-nala-gold'
  }`;

const FULFILLMENT_OPTIONS: { value: FulfillmentMode; label: string; icon: typeof UtensilsCrossed }[] = [
  { value: 'dine-in', label: 'Dine-in', icon: UtensilsCrossed },
  { value: 'collection', label: 'Collection', icon: Store },
  { value: 'delivery', label: 'Delivery', icon: MapPin },
];

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; sub: string; icon: typeof CreditCard }[] = [
  { value: 'card', label: 'Credit / Debit Card', sub: 'Instant authorization', icon: CreditCard },
  { value: 'instant-eft', label: 'Instant EFT', sub: 'Major SA banks', icon: Landmark },
  { value: 'cash-on-pickup', label: 'Pay at Counter / Table', sub: 'Settle on arrival', icon: Banknote },
];

export default function CheckoutScreen({
  totals,
  defaultName,
  defaultPhone,
  submitting,
  onBack,
  onPlaceOrder,
  onInvalid,
}: Props) {
  const [values, setValues] = useState<CheckoutFormValues>({
    customerName: defaultName,
    customerPhone: defaultPhone,
    fulfillment: 'dine-in',
    tableOrAddress: '',
    notes: '',
    paymentMethod: 'card',
    cardHolder: defaultName.toUpperCase(),
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
    eftBank: EFT_BANKS[0],
  });

  const [errors, setErrors] = useState<CheckoutFormErrors>({});

  const update = <K extends keyof CheckoutFormValues>(key: K, value: CheckoutFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const fillDemoCard = () => {
    setValues((prev) => ({
      ...prev,
      paymentMethod: 'card',
      cardHolder: (prev.customerName || 'NALA GUEST').toUpperCase(),
      cardNumber: '4242 4242 4242 4242',
      cardExpiry: '12/30',
      cardCvv: '424',
    }));
    setErrors((prev) => ({
      ...prev,
      cardHolder: undefined,
      cardNumber: undefined,
      cardExpiry: undefined,
      cardCvv: undefined,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validationErrors = validateCheckoutForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      onInvalid();
      return;
    }

    await onPlaceOrder(values);
  };

  const cardBrand = detectCardBrand(values.cardNumber);

  return (
    <>
      <Header title="Checkout & Payment" onBack={onBack} />

      <form onSubmit={(e) => void handleSubmit(e)} noValidate className="space-y-4 px-4 pb-6">
        <div className="flex items-center justify-between rounded-2xl border border-nala-gold/30 bg-nala-card p-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-white/60">Order total</p>
            <p className="font-display text-2xl text-nala-gold">{formatPrice(totals.total)}</p>
          </div>
          <p className="text-xs text-white/70">
            {totals.itemCount} {totals.itemCount === 1 ? 'item' : 'items'}
          </p>
        </div>

        <section aria-labelledby="fulfillment-heading" className="space-y-4 rounded-2xl bg-nala-card p-4">
          <h2 id="fulfillment-heading" className="font-display text-lg text-white">
            Order &amp; guest details
          </h2>

          <div className="grid grid-cols-3 gap-2">
            {FULFILLMENT_OPTIONS.map(({ value, label, icon: Icon }) => {
              const active = values.fulfillment === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => update('fulfillment', value)}
                  className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2.5 text-xs font-medium transition-colors ${
                    active
                      ? 'bg-nala-gold text-black'
                      : 'border border-white/10 bg-black/40 text-white/75'
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              );
            })}
          </div>

          <FormField id="checkout-name" label="Guest name" error={errors.customerName}>
            <input
              id="checkout-name"
              type="text"
              maxLength={ORDER_LIMITS.maxCustomerName}
              value={values.customerName}
              onChange={(e) => update('customerName', e.target.value)}
              placeholder="Your full name"
              aria-invalid={!!errors.customerName}
              className={inputClass(!!errors.customerName)}
            />
          </FormField>

          <FormField id="checkout-phone" label="Contact phone" error={errors.customerPhone}>
            <input
              id="checkout-phone"
              type="tel"
              maxLength={ORDER_LIMITS.maxCustomerPhone}
              value={values.customerPhone}
              onChange={(e) => update('customerPhone', e.target.value)}
              placeholder="+27 82 123 4567"
              aria-invalid={!!errors.customerPhone}
              className={inputClass(!!errors.customerPhone)}
            />
          </FormField>

          <FormField
            id="checkout-location"
            label={
              values.fulfillment === 'dine-in'
                ? 'Table number'
                : values.fulfillment === 'delivery'
                  ? 'Delivery street address'
                  : 'Pickup counter note (optional)'
            }
            error={errors.tableOrAddress}
          >
            <input
              id="checkout-location"
              type="text"
              maxLength={ORDER_LIMITS.maxTableOrAddress}
              value={values.tableOrAddress}
              onChange={(e) => update('tableOrAddress', e.target.value)}
              placeholder={
                values.fulfillment === 'dine-in'
                  ? 'e.g. Table 4'
                  : values.fulfillment === 'delivery'
                    ? 'e.g. 24 Rivonia Rd, Sandton'
                    : 'Front counter pickup'
              }
              aria-invalid={!!errors.tableOrAddress}
              className={inputClass(!!errors.tableOrAddress)}
            />
          </FormField>

          <FormField
            id="checkout-notes"
            label="Kitchen notes (optional)"
            error={errors.notes}
            hint={`${values.notes.length}/${ORDER_LIMITS.maxNotes}`}
          >
            <textarea
              id="checkout-notes"
              rows={2}
              maxLength={ORDER_LIMITS.maxNotes}
              value={values.notes}
              onChange={(e) => update('notes', e.target.value)}
              placeholder="Allergies, sauce on the side, or timing preference"
              aria-invalid={!!errors.notes}
              className="w-full rounded-xl bg-black/40 p-3 text-white placeholder-white/40 outline-none focus:ring-1 focus:ring-nala-gold"
            />
          </FormField>
        </section>

        <section aria-labelledby="payment-heading" className="space-y-4 rounded-2xl bg-nala-card p-4">
          <div className="flex items-center justify-between">
            <h2 id="payment-heading" className="font-display text-lg text-white">
              Payment method
            </h2>
            <span className="inline-flex items-center gap-1 text-[11px] text-nala-gold">
              <Lock size={12} /> Encrypted
            </span>
          </div>

          <div className="space-y-2">
            {PAYMENT_OPTIONS.map(({ value, label, sub, icon: Icon }) => {
              const active = values.paymentMethod === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => update('paymentMethod', value)}
                  className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                    active
                      ? 'border-nala-gold bg-nala-gold/10'
                      : 'border-white/10 bg-black/30'
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      active ? 'bg-nala-gold text-black' : 'bg-black/50 text-white/70'
                    }`}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{label}</p>
                    <p className="text-xs text-white/55">{sub}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {values.paymentMethod === 'card' && (
            <div className="space-y-3 border-t border-white/10 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/60">Card details ({cardBrand})</span>
                <button
                  type="button"
                  onClick={fillDemoCard}
                  className="text-xs text-nala-gold underline"
                >
                  Fill test card
                </button>
              </div>

              <FormField id="card-holder" label="Cardholder name" error={errors.cardHolder}>
                <input
                  id="card-holder"
                  type="text"
                  autoComplete="cc-name"
                  value={values.cardHolder}
                  onChange={(e) => update('cardHolder', e.target.value)}
                  placeholder="NAME ON CARD"
                  aria-invalid={!!errors.cardHolder}
                  className={inputClass(!!errors.cardHolder)}
                />
              </FormField>

              <FormField id="card-number" label="Card number" error={errors.cardNumber}>
                <input
                  id="card-number"
                  type="text"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  value={values.cardNumber}
                  onChange={(e) => update('cardNumber', formatCardNumberInput(e.target.value))}
                  placeholder="4242 4242 4242 4242"
                  aria-invalid={!!errors.cardNumber}
                  className={inputClass(!!errors.cardNumber)}
                />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField id="card-expiry" label="Expiry (MM/YY)" error={errors.cardExpiry}>
                  <input
                    id="card-expiry"
                    type="text"
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    maxLength={5}
                    value={values.cardExpiry}
                    onChange={(e) => update('cardExpiry', formatCardExpiryInput(e.target.value))}
                    placeholder="12/30"
                    aria-invalid={!!errors.cardExpiry}
                    className={inputClass(!!errors.cardExpiry)}
                  />
                </FormField>

                <FormField id="card-cvv" label="CVV" error={errors.cardCvv}>
                  <input
                    id="card-cvv"
                    type="password"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    maxLength={4}
                    value={values.cardCvv}
                    onChange={(e) => update('cardCvv', e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="123"
                    aria-invalid={!!errors.cardCvv}
                    className={inputClass(!!errors.cardCvv)}
                  />
                </FormField>
              </div>
              <p className="text-[11px] text-white/50">
                Card numbers are Luhn-validated locally; only the last 4 digits are saved to your receipt.
              </p>
            </div>
          )}

          {values.paymentMethod === 'instant-eft' && (
            <div className="space-y-3 border-t border-white/10 pt-3">
              <FormField id="eft-bank" label="Select bank" error={errors.eftBank}>
                <select
                  id="eft-bank"
                  value={values.eftBank}
                  onChange={(e) => update('eftBank', e.target.value)}
                  className={inputClass(!!errors.eftBank)}
                >
                  {EFT_BANKS.map((bank) => (
                    <option key={bank} value={bank}>
                      {bank}
                    </option>
                  ))}
                </select>
              </FormField>
              <p className="text-xs text-white/60">
                Your {values.eftBank} Instant EFT reference is authorized immediately upon confirmation.
              </p>
            </div>
          )}

          {values.paymentMethod === 'cash-on-pickup' && (
            <p className="border-t border-white/10 pt-3 text-xs text-white/70">
              Your kitchen ticket is placed immediately and payment will be collected at your table or the front counter.
            </p>
          )}
        </section>

        <button
          type="submit"
          disabled={submitting}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-nala-gold font-semibold text-black disabled:opacity-50"
        >
          {submitting
            ? 'Authorizing payment…'
            : values.paymentMethod === 'cash-on-pickup'
              ? `Confirm Order · ${formatPrice(totals.total)}`
              : `Pay & Place Order · ${formatPrice(totals.total)}`}
        </button>
      </form>
    </>
  );
}
