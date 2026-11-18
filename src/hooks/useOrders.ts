import type { User } from 'firebase/auth';
import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import type { CartItem, OrderRecord } from '../types';
import { buildOrderRecord, nextOrderStatus, type CheckoutFormValues } from '../utils/orderUtils';
import { getProviderKind } from './useUserProfile';

const LOCAL_ORDERS_PREFIX = 'nala.orders.v1.';

function loadLocalOrders(uid: string): OrderRecord[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_ORDERS_PREFIX}${uid}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as OrderRecord[]) : [];
  } catch {
    return [];
  }
}

function saveLocalOrders(uid: string, orders: OrderRecord[]): void {
  try {
    localStorage.setItem(`${LOCAL_ORDERS_PREFIX}${uid}`, JSON.stringify(orders.slice(0, 50)));
  } catch {
    // Ignore storage unavailability
  }
}

export function useOrders(user: User | null, emailVerified: boolean) {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(Boolean(user));
  const [submitting, setSubmitting] = useState(false);

  const canSyncFirestore = Boolean(user && (emailVerified || getProviderKind(user) === 'phone'));

  useEffect(() => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    if (!canSyncFirestore) {
      setOrders(loadLocalOrders(user.uid));
      setLoading(false);
      return;
    }

    setLoading(true);
    const ordersPath = 'orders';
    const q = query(collection(db, ordersPath), where('userId', '==', user.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const next: OrderRecord[] = snapshot.docs
          .map((d) => d.data() as OrderRecord)
          .sort((a, b) => (b.createdAtMs ?? 0) - (a.createdAtMs ?? 0));
        setOrders(next);
        saveLocalOrders(user.uid, next);
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        handleFirestoreError(err, OperationType.LIST, ordersPath);
      },
    );

    return () => unsubscribe();
  }, [user, canSyncFirestore]);

  const placeOrder = useCallback(
    async (
      cartItems: readonly CartItem[],
      tipPercent: number,
      values: CheckoutFormValues,
    ): Promise<OrderRecord> => {
      if (!user) {
        throw new Error('You must be signed in to place an order.');
      }
      if (cartItems.length === 0) {
        throw new Error('Your cart is empty.');
      }

      const orderId = crypto.randomUUID();
      const record = buildOrderRecord({
        id: orderId,
        userId: user.uid,
        cartItems,
        tipPercent,
        values,
      });

      setSubmitting(true);
      try {
        if (!canSyncFirestore) {
          setOrders((prev) => {
            const next = [record, ...prev];
            saveLocalOrders(user.uid, next);
            return next;
          });
          return record;
        }

        const orderPath = `orders/${orderId}`;
        const ref = doc(db, 'orders', orderId);
        await setDoc(ref, {
          ...record,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }).catch((err) => handleFirestoreError(err, OperationType.CREATE, orderPath));

        return record;
      } finally {
        setSubmitting(false);
      }
    },
    [user, canSyncFirestore],
  );

  const advanceStatus = useCallback(
    async (order: OrderRecord) => {
      if (!user) return;
      const next = nextOrderStatus(order.status);
      if (!next) return;

      const nextPaymentStatus = next === 'completed' ? 'paid' : order.paymentStatus;

      if (!canSyncFirestore) {
        setOrders((prev) => {
          const updated = prev.map((o) =>
            o.id === order.id ? { ...o, status: next, paymentStatus: nextPaymentStatus } : o,
          );
          saveLocalOrders(user.uid, updated);
          return updated;
        });
        return;
      }

      const orderPath = `orders/${order.id}`;
      try {
        await updateDoc(doc(db, 'orders', order.id), {
          status: next,
          paymentStatus: nextPaymentStatus,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, orderPath);
      }
    },
    [user, canSyncFirestore],
  );

  return {
    orders,
    loading,
    submitting,
    canSyncFirestore,
    placeOrder,
    advanceStatus,
  };
}
