import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CartItem, MenuItem, OrderTotals } from '../types';
import { calculateOrderTotals, ORDER_LIMITS } from '../utils/orderUtils';

const CART_STORAGE_KEY = 'nala.cart.v1';

interface StoredCart {
  items: CartItem[];
  tipPercent: number;
}

function isValidCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.menuItemId === 'string' &&
    v.menuItemId.length > 0 &&
    typeof v.name === 'string' &&
    typeof v.course === 'string' &&
    typeof v.unitPrice === 'number' &&
    v.unitPrice > 0 &&
    typeof v.quantity === 'number' &&
    v.quantity >= 1
  );
}

function loadCart(): StoredCart {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return { items: [], tipPercent: 10 };
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object') {
      const obj = parsed as Record<string, unknown>;
      const rawItems = Array.isArray(obj.items) ? obj.items.filter(isValidCartItem) : [];
      const tipPercent =
        typeof obj.tipPercent === 'number' && obj.tipPercent >= 0 && obj.tipPercent <= 50 ? obj.tipPercent : 10;
      return { items: rawItems.slice(0, ORDER_LIMITS.maxUniqueItems), tipPercent };
    }
  } catch {
    // Ignore storage unavailability
  }
  return { items: [], tipPercent: 10 };
}

export interface AddToCartResult {
  ok: boolean;
  reason?: string;
}

export function useCart() {
  const [initial] = useState<StoredCart>(loadCart);
  const [items, setItems] = useState<CartItem[]>(initial.items);
  const [tipPercent, setTipPercent] = useState<number>(initial.tipPercent);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ items, tipPercent }));
    } catch {
      // Ignore storage errors
    }
  }, [items, tipPercent]);

  const totals: OrderTotals = useMemo(() => calculateOrderTotals(items, tipPercent), [items, tipPercent]);

  const getQuantity = useCallback(
    (menuItemId: string): number => items.find((i) => i.menuItemId === menuItemId)?.quantity ?? 0,
    [items],
  );

  const addToCart = useCallback((dish: MenuItem, amount = 1): AddToCartResult => {
    if (!dish.isAvailable) {
      return { ok: false, reason: `"${dish.name}" is currently unavailable.` };
    }

    const safeAdd = Math.max(1, Math.min(ORDER_LIMITS.maxQtyPerItem, Math.floor(amount)));
    let result: AddToCartResult = { ok: true };

    setItems((prev) => {
      const existing = prev.find((i) => i.menuItemId === dish.id);
      if (existing) {
        if (existing.quantity >= ORDER_LIMITS.maxQtyPerItem) {
          result = { ok: false, reason: `Maximum ${ORDER_LIMITS.maxQtyPerItem} per dish reached.` };
          return prev;
        }
        return prev.map((i) =>
          i.menuItemId === dish.id
            ? {
                ...i,
                name: dish.name,
                unitPrice: dish.price,
                image: dish.image,
                quantity: Math.min(ORDER_LIMITS.maxQtyPerItem, i.quantity + safeAdd),
              }
            : i,
        );
      }

      if (prev.length >= ORDER_LIMITS.maxUniqueItems) {
        result = { ok: false, reason: `Cart is limited to ${ORDER_LIMITS.maxUniqueItems} distinct dishes.` };
        return prev;
      }

      return [
        ...prev,
        {
          menuItemId: dish.id,
          name: dish.name,
          course: dish.course,
          unitPrice: dish.price,
          quantity: safeAdd,
          image: dish.image,
        },
      ];
    });

    return result;
  }, []);

  const updateQuantity = useCallback((menuItemId: string, quantity: number) => {
    const nextQty = Math.floor(quantity);
    setItems((prev) => {
      if (nextQty <= 0) {
        return prev.filter((i) => i.menuItemId !== menuItemId);
      }
      return prev.map((i) =>
        i.menuItemId === menuItemId
          ? { ...i, quantity: Math.min(ORDER_LIMITS.maxQtyPerItem, nextQty) }
          : i,
      );
    });
  }, []);

  const removeFromCart = useCallback((menuItemId: string) => {
    setItems((prev) => prev.filter((i) => i.menuItemId !== menuItemId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  return {
    items,
    tipPercent,
    setTipPercent,
    totals,
    getQuantity,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
  };
}
