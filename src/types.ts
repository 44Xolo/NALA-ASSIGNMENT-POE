export const COURSES = ['Starter', 'Main', 'Dessert', 'Drink'] as const;
export type Course = (typeof COURSES)[number];
export type CourseFilter = Course | 'All';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  course: Course;
  price: number;
  ingredients: string[];
  prepTime: number;
  isAvailable: boolean;
  image?: string;
  dateCreated: string;
  lastModified: string;
}

export type MenuItemInput = Omit<MenuItem, 'id' | 'dateCreated' | 'lastModified'>;

export type AuthProviderKind = 'google' | 'phone' | 'email';

export interface UserProfile {
  uid: string;
  displayName: string;
  role: string;
  restaurant: string;
  specialty: string;
  yearsExperience: number;
  bio: string;
  contactEmail: string;
  contactPhone: string;
  authProvider: AuthProviderKind;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type UserProfileUpdate = Pick<
  UserProfile,
  'displayName' | 'role' | 'restaurant' | 'specialty' | 'yearsExperience' | 'bio' | 'contactEmail' | 'contactPhone'
>;

export interface CartItem {
  menuItemId: string;
  name: string;
  course: Course;
  unitPrice: number;
  quantity: number;
  image?: string;
}

export type FulfillmentMode = 'dine-in' | 'collection' | 'delivery';
export type PaymentMethod = 'card' | 'instant-eft' | 'cash-on-pickup';
export type PaymentStatus = 'paid' | 'pending_collection';
export type OrderStatus = 'paid' | 'preparing' | 'ready' | 'completed';

export interface OrderItemRecord {
  menuItemId: string;
  name: string;
  course: Course;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderTotals {
  itemCount: number;
  subtotal: number;
  serviceFee: number;
  tip: number;
  total: number;
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  fulfillment: FulfillmentMode;
  tableOrAddress: string;
  notes: string;
  paymentMethod: PaymentMethod;
  paymentLast4: string;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  items: OrderItemRecord[];
  subtotal: number;
  serviceFee: number;
  tip: number;
  total: number;
  createdAtMs: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type Screen =
  | { name: 'home' }
  | { name: 'detail'; id: string }
  | { name: 'cart' }
  | { name: 'checkout' }
  | { name: 'orders'; highlightOrderId?: string }
  | { name: 'manage' }
  | { name: 'add' }
  | { name: 'edit'; id: string }
  | { name: 'stats' }
  | { name: 'settings' };

export type ToastKind = 'success' | 'error';

export interface ToastState {
  message: string;
  kind: ToastKind;
  action?: { label: string; onClick: () => void };
}
