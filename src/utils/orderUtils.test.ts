import { describe, expect, it } from 'vitest';
import type { CartItem } from '../types';
import {
  buildOrderRecord,
  calculateOrderTotals,
  detectCardBrand,
  formatCardExpiryInput,
  formatCardNumberInput,
  isCardExpiryValid,
  luhnCheck,
  nextOrderStatus,
  validateCheckoutForm,
  type CheckoutFormValues,
} from './orderUtils';

const SAMPLE_CART: CartItem[] = [
  { menuItemId: 'dish-1', name: 'Coq au Vin', course: 'Main', unitPrice: 245, quantity: 2 },
  { menuItemId: 'dish-2', name: 'Creme Brulee', course: 'Dessert', unitPrice: 110, quantity: 1 },
];

const VALID_CARD_FORM: CheckoutFormValues = {
  customerName: 'Thabo Mokoena',
  customerPhone: '+27 82 555 0199',
  fulfillment: 'dine-in',
  tableOrAddress: 'Table 7',
  notes: 'No nuts please',
  paymentMethod: 'card',
  cardHolder: 'THABO MOKOENA',
  cardNumber: '4242 4242 4242 4242',
  cardExpiry: '12/30',
  cardCvv: '123',
  eftBank: 'FNB',
};

describe('calculateOrderTotals', () => {
  it('computes subtotal, 5% service fee, tip, and grand total', () => {
    const totals = calculateOrderTotals(SAMPLE_CART, 10);
    expect(totals.itemCount).toBe(3);
    expect(totals.subtotal).toBe(600);
    expect(totals.serviceFee).toBe(30);
    expect(totals.tip).toBe(60);
    expect(totals.total).toBe(690);
  });

  it('handles empty cart and zero tip', () => {
    expect(calculateOrderTotals([], 15)).toEqual({
      itemCount: 0,
      subtotal: 0,
      serviceFee: 0,
      tip: 0,
      total: 0,
    });
  });
});

describe('card & checkout validation', () => {
  it('validates Luhn card numbers and detects brands', () => {
    expect(luhnCheck('4242 4242 4242 4242')).toBe(true);
    expect(luhnCheck('4242 4242 4242 4243')).toBe(false);
    expect(detectCardBrand('4242 4242')).toBe('Visa');
    expect(detectCardBrand('5500 0000')).toBe('Mastercard');
    expect(formatCardNumberInput('4242424242424242')).toBe('4242 4242 4242 4242');
    expect(formatCardExpiryInput('1230')).toBe('12/30');
  });

  it('validates future expiry dates', () => {
    const now = new Date('2026-11-18T10:00:00Z');
    expect(isCardExpiryValid('11/26', now)).toBe(true);
    expect(isCardExpiryValid('10/26', now)).toBe(false);
    expect(isCardExpiryValid('13/28', now)).toBe(false);
  });

  it('accepts valid card checkout and flags missing dine-in table or invalid card', () => {
    const now = new Date('2026-11-18T10:00:00Z');
    expect(validateCheckoutForm(VALID_CARD_FORM, now)).toEqual({});

    const bad = validateCheckoutForm(
      { ...VALID_CARD_FORM, tableOrAddress: '', cardNumber: '4242 4242 4242 4241', cardCvv: '1' },
      now,
    );
    expect(bad.tableOrAddress).toBeTruthy();
    expect(bad.cardNumber).toBeTruthy();
    expect(bad.cardCvv).toBeTruthy();
  });

  it('skips card checks for cash-on-pickup and defaults collection location', () => {
    const record = buildOrderRecord({
      id: 'ord-1',
      userId: 'user-1',
      cartItems: SAMPLE_CART,
      tipPercent: 10,
      values: { ...VALID_CARD_FORM, fulfillment: 'collection', tableOrAddress: '', paymentMethod: 'cash-on-pickup' },
      nowMs: 1700000000000,
    });
    expect(record.tableOrAddress).toBe('Front Counter Pickup');
    expect(record.paymentLast4).toBe('COUNTER');
    expect(record.paymentStatus).toBe('pending_collection');
    expect(record.total).toBe(690);
    expect(nextOrderStatus('paid')).toBe('preparing');
    expect(nextOrderStatus('completed')).toBeNull();
  });
});
