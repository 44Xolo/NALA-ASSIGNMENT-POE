import type {
  CartItem,
  FulfillmentMode,
  OrderItemRecord,
  OrderRecord,
  OrderStatus,
  OrderTotals,
  PaymentMethod,
} from '../types';

export const ORDER_LIMITS = {
  maxUniqueItems: 25,
  maxQtyPerItem: 20,
  maxCustomerName: 80,
  maxCustomerPhone: 32,
  maxTableOrAddress: 120,
  maxNotes: 200,
  serviceFeeRate: 0.05,
} as const;

export const TIP_PERCENT_OPTIONS = [0, 10, 15, 20] as const;

export const EFT_BANKS = ['FNB', 'Standard Bank', 'Capitec', 'Nedbank', 'Absa'] as const;
export type EftBank = (typeof EFT_BANKS)[number];

export interface CheckoutFormValues {
  customerName: string;
  customerPhone: string;
  fulfillment: FulfillmentMode;
  tableOrAddress: string;
  notes: string;
  paymentMethod: PaymentMethod;
  cardHolder: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvv: string;
  eftBank: string;
}

export type CheckoutFormErrors = Partial<Record<keyof CheckoutFormValues, string>>;

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculateOrderTotals(items: readonly CartItem[], tipPercent: number): OrderTotals {
  const safeTipPct = Number.isFinite(tipPercent) && tipPercent > 0 ? tipPercent : 0;
  let itemCount = 0;
  let subtotal = 0;

  for (const item of items) {
    const qty = Math.max(0, Math.min(ORDER_LIMITS.maxQtyPerItem, Math.floor(item.quantity)));
    itemCount += qty;
    subtotal += Math.max(0, item.unitPrice) * qty;
  }

  subtotal = roundMoney(subtotal);
  const serviceFee = roundMoney(subtotal * ORDER_LIMITS.serviceFeeRate);
  const tip = roundMoney(subtotal * (safeTipPct / 100));
  const total = roundMoney(subtotal + serviceFee + tip);

  return { itemCount, subtotal, serviceFee, tip, total };
}

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

export function formatCardNumberInput(raw: string): string {
  const digits = digitsOnly(raw).slice(0, 16);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

export function formatCardExpiryInput(raw: string): string {
  const digits = digitsOnly(raw).slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function detectCardBrand(rawNumber: string): 'Visa' | 'Mastercard' | 'Amex' | 'Card' {
  const digits = digitsOnly(rawNumber);
  if (digits.startsWith('4')) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'Mastercard';
  if (/^3[47]/.test(digits)) return 'Amex';
  return 'Card';
}

export function luhnCheck(rawNumber: string): boolean {
  const digits = digitsOnly(rawNumber);
  if (digits.length < 13 || digits.length > 19) return false;

  let sum = 0;
  let doubleDigit = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = Number(digits[i]);
    if (doubleDigit) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    doubleDigit = !doubleDigit;
  }
  return sum % 10 === 0;
}

export function isCardExpiryValid(mmYy: string, now = new Date()): boolean {
  const match = mmYy.trim().match(/^(\d{2})\/(\d{2})$/);
  if (!match) return false;
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) return false;

  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  return year > currentYear || (year === currentYear && month >= currentMonth);
}

export function validateCheckoutForm(values: CheckoutFormValues, now = new Date()): CheckoutFormErrors {
  const errors: CheckoutFormErrors = {};

  const name = values.customerName.trim();
  if (name.length < 2) {
    errors.customerName = 'Enter the recipient name (at least 2 characters).';
  } else if (name.length > ORDER_LIMITS.maxCustomerName) {
    errors.customerName = `Name cannot exceed ${ORDER_LIMITS.maxCustomerName} characters.`;
  }

  const phone = values.customerPhone.trim();
  if (phone && !/^[+\d\s()-]{7,32}$/.test(phone)) {
    errors.customerPhone = 'Enter a valid contact phone number.';
  }

  const location = values.tableOrAddress.trim();
  if (values.fulfillment === 'dine-in' && !location) {
    errors.tableOrAddress = 'Enter your table number (e.g. Table 4).';
  } else if (values.fulfillment === 'delivery' && location.length < 5) {
    errors.tableOrAddress = 'Enter your full delivery street address.';
  } else if (location.length > ORDER_LIMITS.maxTableOrAddress) {
    errors.tableOrAddress = `Cannot exceed ${ORDER_LIMITS.maxTableOrAddress} characters.`;
  }

  if (values.notes.trim().length > ORDER_LIMITS.maxNotes) {
    errors.notes = `Notes cannot exceed ${ORDER_LIMITS.maxNotes} characters.`;
  }

  if (values.paymentMethod === 'card') {
    if (values.cardHolder.trim().length < 2) {
      errors.cardHolder = 'Enter the name printed on the card.';
    }
    if (!luhnCheck(values.cardNumber)) {
      errors.cardNumber = 'Enter a valid 13–16 digit card number.';
    }
    if (!isCardExpiryValid(values.cardExpiry, now)) {
      errors.cardExpiry = 'Enter a valid future expiry (MM/YY).';
    }
    const cvvDigits = digitsOnly(values.cardCvv);
    if (cvvDigits.length < 3 || cvvDigits.length > 4) {
      errors.cardCvv = 'Enter a 3 or 4-digit CVV.';
    }
  } else if (values.paymentMethod === 'instant-eft' && !values.eftBank.trim()) {
    errors.eftBank = 'Select your bank for Instant EFT.';
  }

  return errors;
}

export function generateOrderNumber(): string {
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `NALA-${randomDigits}`;
}

export function nextOrderStatus(current: OrderStatus): OrderStatus | null {
  switch (current) {
    case 'paid':
      return 'preparing';
    case 'preparing':
      return 'ready';
    case 'ready':
      return 'completed';
    case 'completed':
      return null;
  }
}

export interface BuildOrderParams {
  id: string;
  userId: string;
  cartItems: readonly CartItem[];
  tipPercent: number;
  values: CheckoutFormValues;
  nowMs?: number;
}

export function buildOrderRecord({
  id,
  userId,
  cartItems,
  tipPercent,
  values,
  nowMs = Date.now(),
}: BuildOrderParams): OrderRecord {
  const boundedItems: OrderItemRecord[] = cartItems
    .slice(0, ORDER_LIMITS.maxUniqueItems)
    .map((item) => {
      const quantity = Math.max(1, Math.min(ORDER_LIMITS.maxQtyPerItem, Math.floor(item.quantity)));
      const unitPrice = roundMoney(Math.max(0.01, item.unitPrice));
      return {
        menuItemId: item.menuItemId.slice(0, 128),
        name: item.name.trim().slice(0, 100) || 'Menu Dish',
        course: item.course,
        unitPrice,
        quantity,
        lineTotal: roundMoney(unitPrice * quantity),
      };
    });

  const totals = calculateOrderTotals(cartItems.slice(0, ORDER_LIMITS.maxUniqueItems), tipPercent);

  const rawLocation = values.tableOrAddress.trim();
  const tableOrAddress = (
    values.fulfillment === 'collection' && !rawLocation ? 'Front Counter Pickup' : rawLocation
  ).slice(0, ORDER_LIMITS.maxTableOrAddress);

  const cardDigits = digitsOnly(values.cardNumber);
  const paymentLast4 =
    values.paymentMethod === 'card'
      ? (cardDigits.slice(-4) || '0000')
      : values.paymentMethod === 'instant-eft'
        ? values.eftBank.trim().slice(0, 16) || 'EFT'
        : 'COUNTER';

  const paymentStatus = values.paymentMethod === 'cash-on-pickup' ? 'pending_collection' : 'paid';

  return {
    id,
    orderNumber: generateOrderNumber(),
    userId,
    customerName: values.customerName.trim().slice(0, ORDER_LIMITS.maxCustomerName),
    customerPhone: values.customerPhone.trim().slice(0, ORDER_LIMITS.maxCustomerPhone),
    fulfillment: values.fulfillment,
    tableOrAddress,
    notes: values.notes.trim().slice(0, ORDER_LIMITS.maxNotes),
    paymentMethod: values.paymentMethod,
    paymentLast4,
    paymentStatus,
    status: 'paid',
    items: boundedItems,
    subtotal: totals.subtotal,
    serviceFee: totals.serviceFee,
    tip: totals.tip,
    total: totals.total,
    createdAtMs: Math.floor(nowMs),
  };
}
