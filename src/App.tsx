import { sendEmailVerification, signOut as firebaseSignOut } from 'firebase/auth';
import { useCallback, useState } from 'react';
import BottomNav from './components/BottomNav';
import Toast from './components/Toast';
import { useCart } from './hooks/useCart';
import { useFirebaseAuth } from './hooks/useFirebaseAuth';
import { useMenu } from './hooks/useMenu';
import { useOrders } from './hooks/useOrders';
import { useUserProfile } from './hooks/useUserProfile';
import CartScreen from './screens/CartScreen';
import CheckoutScreen from './screens/CheckoutScreen';
import DetailScreen from './screens/DetailScreen';
import FormScreen from './screens/FormScreen';
import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
import ManageScreen from './screens/ManageScreen';
import OrdersScreen from './screens/OrdersScreen';
import SettingsScreen from './screens/SettingsScreen';
import StatsScreen from './screens/StatsScreen';
import type { MenuItem, MenuItemInput, Screen, ToastKind, ToastState } from './types';
import type { CheckoutFormValues } from './utils/orderUtils';

export default function App() {
  const menu = useMenu();
  const cart = useCart();
  const { auth, user, emailVerified, loading: authLoading, error: authError, refreshUser } = useFirebaseAuth();
  const userProfile = useUserProfile(user, emailVerified);
  const orderStore = useOrders(user, emailVerified);
  const [screen, setScreen] = useState<Screen>({ name: 'home' });
  const [toast, setToast] = useState<ToastState | null>(null);

  const notify = (message: string, kind: ToastKind = 'success') => setToast({ message, kind });
  const dismissToast = useCallback(() => setToast(null), []);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setScreen({ name: 'home' });
    } catch {
      notify('Unable to sign out right now.', 'error');
    }
  };

  const resendVerification = async () => {
    if (!user) return;
    try {
      await sendEmailVerification(user);
      notify('Verification email sent. Check your inbox.');
    } catch {
      notify('Could not send verification email right now.', 'error');
    }
  };

  const checkVerification = async () => {
    try {
      const verified = await refreshUser();
      if (verified) {
        notify('Email verified. Profile synced to cloud.');
      } else {
        notify('Email is not verified yet. Open the link in your inbox.', 'error');
      }
    } catch {
      notify('Unable to check verification status right now.', 'error');
    }
  };

  if (authLoading) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-6">
        <h1 className="font-display text-4xl tracking-widest text-nala-gold">NALA</h1>
        <p className="mt-2 text-sm text-white/60">Preparing your kitchen workspace…</p>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen auth={auth} authError={authError} />;
  }

  const fallbackName = user.displayName || user.email?.split('@')[0] || user.phoneNumber || 'Chef';
  const userName = userProfile.profile?.displayName || fallbackName;
  const userTitle = [userProfile.profile?.role, userProfile.profile?.restaurant].filter(Boolean).join(' · ');
  const contactPhone = userProfile.profile?.contactPhone || user.phoneNumber || '';

  const find = (id: string) => menu.items.find((i) => i.id === id);
  const go = (s: Screen) => setScreen(s);

  const handleAddToCart = (dish: MenuItem, qty = 1) => {
    const res = cart.addToCart(dish, qty);
    if (!res.ok) {
      notify(res.reason ?? 'Could not add dish to cart.', 'error');
      return;
    }
    setToast({
      message: `${qty}× "${dish.name}" added to cart.`,
      kind: 'success',
      action: { label: 'Cart', onClick: () => go({ name: 'cart' }) },
    });
  };

  const handlePlaceOrder = async (values: CheckoutFormValues) => {
    try {
      const created = await orderStore.placeOrder(cart.items, cart.tipPercent, values);
      cart.clearCart();
      notify(`Order ${created.orderNumber} confirmed!`);
      go({ name: 'orders', highlightOrderId: created.id });
    } catch {
      notify('Unable to complete order right now. Please try again.', 'error');
    }
  };

  const renderScreen = () => {
    switch (screen.name) {
      case 'home':
        return (
          <HomeScreen
            items={menu.items}
            userName={userName}
            userTitle={userTitle || undefined}
            cartCount={cart.totals.itemCount}
            cartSubtotal={cart.totals.subtotal}
            getCartQty={cart.getQuantity}
            onAddToCart={(dish) => handleAddToCart(dish, 1)}
            onUpdateCartQty={cart.updateQuantity}
            onOpenCart={() => go({ name: 'cart' })}
            onOpen={(id) => go({ name: 'detail', id })}
            onAdd={() => go({ name: 'add' })}
            onSignOut={() => void signOut()}
          />
        );
      case 'detail': {
        const dish = find(screen.id);
        return (
          <DetailScreen
            item={dish}
            inCartQty={dish ? cart.getQuantity(dish.id) : 0}
            onBack={() => go({ name: 'home' })}
            onEdit={(id) => go({ name: 'edit', id })}
            onAddToCart={handleAddToCart}
            onViewCart={() => go({ name: 'cart' })}
          />
        );
      }
      case 'cart':
        return (
          <CartScreen
            items={cart.items}
            totals={cart.totals}
            tipPercent={cart.tipPercent}
            onTipChange={cart.setTipPercent}
            onUpdateQty={cart.updateQuantity}
            onRemove={cart.removeFromCart}
            onClear={() => {
              cart.clearCart();
              notify('Cart cleared.');
            }}
            onBrowseMenu={() => go({ name: 'home' })}
            onCheckout={() => go({ name: 'checkout' })}
          />
        );
      case 'checkout':
        if (cart.items.length === 0) {
          return (
            <CartScreen
              items={cart.items}
              totals={cart.totals}
              tipPercent={cart.tipPercent}
              onTipChange={cart.setTipPercent}
              onUpdateQty={cart.updateQuantity}
              onRemove={cart.removeFromCart}
              onClear={cart.clearCart}
              onBrowseMenu={() => go({ name: 'home' })}
              onCheckout={() => go({ name: 'checkout' })}
            />
          );
        }
        return (
          <CheckoutScreen
            totals={cart.totals}
            defaultName={userName}
            defaultPhone={contactPhone}
            submitting={orderStore.submitting}
            onBack={() => go({ name: 'cart' })}
            onPlaceOrder={handlePlaceOrder}
            onInvalid={() => notify('Please fix the highlighted checkout fields.', 'error')}
          />
        );
      case 'orders':
        return (
          <OrdersScreen
            orders={orderStore.orders}
            loading={orderStore.loading}
            canSyncFirestore={orderStore.canSyncFirestore}
            highlightOrderId={screen.highlightOrderId}
            onAdvanceStatus={async (order) => {
              try {
                await orderStore.advanceStatus(order);
                notify(`Order ${order.orderNumber} updated.`);
              } catch {
                notify('Could not update order status.', 'error');
              }
            }}
            onBrowseMenu={() => go({ name: 'home' })}
          />
        );
      case 'manage':
        return (
          <ManageScreen
            items={menu.items}
            onEdit={(id) => go({ name: 'edit', id })}
            onDelete={(item) => {
              const index = menu.items.findIndex((i) => i.id === item.id);
              menu.deleteItem(item.id);
              setToast({
                message: `"${item.name}" was deleted.`,
                kind: 'success',
                action: { label: 'Undo', onClick: () => menu.restoreItem(item, index) },
              });
            }}
            onAdd={() => go({ name: 'add' })}
            onReset={() => {
              menu.resetMenu();
              notify('Original menu restored.');
            }}
          />
        );
      case 'add':
        return (
          <FormScreen
            mode="add"
            allItems={menu.items}
            onSubmit={(input: MenuItemInput) => {
              menu.addItem(input);
              notify(`"${input.name}" added to the menu.`);
              go({ name: 'manage' });
            }}
            onCancel={() => go({ name: 'home' })}
            onInvalid={() => notify('Please fix the highlighted fields.', 'error')}
          />
        );
      case 'edit':
        return (
          <FormScreen
            mode="edit"
            item={find(screen.id)}
            allItems={menu.items}
            onSubmit={(input: MenuItemInput) => {
              menu.updateItem(screen.id, input);
              notify(`"${input.name}" updated.`);
              go({ name: 'manage' });
            }}
            onCancel={() => go({ name: 'manage' })}
            onInvalid={() => notify('Please fix the highlighted fields.', 'error')}
          />
        );
      case 'stats':
        return <StatsScreen items={menu.items} />;
      case 'settings':
        return (
          <SettingsScreen
            profile={userProfile.profile}
            photoUrl={user.photoURL}
            emailVerified={emailVerified}
            fallbackName={fallbackName}
            fallbackEmail={user.email ?? ''}
            fallbackPhone={user.phoneNumber ?? ''}
            menuItems={menu.items}
            loading={userProfile.loading}
            saving={userProfile.saving}
            error={userProfile.error}
            onSaveProfile={userProfile.saveProfile}
            onResendVerification={resendVerification}
            onCheckVerification={checkVerification}
            onSaved={() => notify('Profile updated.')}
            onInvalid={() => notify('Please fix the highlighted profile fields.', 'error')}
            onSignOut={() => void signOut()}
          />
        );
    }
  };

  return (
    <div className="mx-auto min-h-screen w-full max-w-md pb-24">
      {renderScreen()}
      <Toast toast={toast} onDismiss={dismissToast} />
      <BottomNav current={screen.name} cartCount={cart.totals.itemCount} onNavigate={go} />
    </div>
  );
}
