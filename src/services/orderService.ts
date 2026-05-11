import {
  getDocs,
  addDoc,
  updateDoc,
  collection,
  doc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Order, OrderStatus, PaymentStatus, ShippingAddress } from '../types/order';
import { CartItem } from '../types/cart';
import { SHIPPING_COST } from '../config/constants';

export async function createOrder(
  userId: string,
  items: CartItem[],
  shippingAddress: ShippingAddress
): Promise<string> {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal + SHIPPING_COST;

  const docRef = await addDoc(collection(db, 'orders'), {
    userId,
    items: items.map((item) => ({
      productId: item.productId,
      name: item.name,
      nameAr: item.nameAr || '',
      nameEn: item.nameEn || '',
      price: item.price,
      quantity: item.quantity,
      image: item.image || '',
    })),
    subtotal,
    shipping: SHIPPING_COST,
    total,
    status: 'pending',
    paymentStatus: 'unpaid',
    paymentMethod: 'cash_on_delivery',
    shippingAddress,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function getUserOrders(userId: string): Promise<Order[]> {
  // Use where filter only (no orderBy) to avoid needing a composite index.
  // Security rules require userId match for non-admin users.
  const q = query(
    collection(db, 'orders'),
    where('userId', '==', userId)
  );
  const snapshot = await getDocs(q);
  const orders = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
  return orders.sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() || 0;
    const bTime = b.createdAt?.toMillis?.() || 0;
    return bTime - aTime;
  });
}

export async function getAllOrders(): Promise<Order[]> {
  // Admin-only: fetches all orders, sorts client-side
  const snapshot = await getDocs(collection(db, 'orders'));
  const orders = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
  return orders.sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() || 0;
    const bTime = b.createdAt?.toMillis?.() || 0;
    return bTime - aTime;
  });
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<void> {
  const docRef = doc(db, 'orders', orderId);
  await updateDoc(docRef, { status, updatedAt: serverTimestamp() });
}

export async function updatePaymentStatus(
  orderId: string,
  paymentStatus: PaymentStatus
): Promise<void> {
  const docRef = doc(db, 'orders', orderId);
  await updateDoc(docRef, { paymentStatus, updatedAt: serverTimestamp() });
}
