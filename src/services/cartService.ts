import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { CartItem } from '../types/cart';
import { Product } from '../types/product';
import { getProductPrimaryImage } from '../utils/productImages';

export async function getCartItems(userId: string): Promise<CartItem[]> {
  const itemsRef = collection(db, 'carts', userId, 'items');
  const snapshot = await getDocs(itemsRef);
  return snapshot.docs.map((d) => d.data() as CartItem);
}

export async function addToCart(userId: string, product: Product): Promise<void> {
  const effectivePrice =
    product.discountPrice > 0 && product.discountPrice < product.price
      ? product.discountPrice
      : product.price;

  // Ensure cart doc exists
  const cartRef = doc(db, 'carts', userId);
  const cartSnap = await getDoc(cartRef);
  if (!cartSnap.exists()) {
    await setDoc(cartRef, {
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  const itemRef = doc(db, 'carts', userId, 'items', product.id);
  const itemSnap = await getDoc(itemRef);

  if (itemSnap.exists()) {
    const currentQty = itemSnap.data().quantity || 0;
    if (currentQty >= product.stock) {
      throw new Error('cart/max-stock');
    }
    await updateDoc(itemRef, { quantity: increment(1) });
  } else {
    await setDoc(itemRef, {
      productId: product.id,
      name: product.name,
      nameAr: product.nameAr || '',
      nameEn: product.nameEn || '',
      price: effectivePrice,
      quantity: 1,
      image: getProductPrimaryImage(product),
    });
  }

  await updateDoc(cartRef, { updatedAt: serverTimestamp() });
}

export async function updateCartItemQuantity(
  userId: string,
  productId: string,
  quantity: number
): Promise<void> {
  if (quantity <= 0) {
    await removeCartItem(userId, productId);
    return;
  }
  const itemRef = doc(db, 'carts', userId, 'items', productId);
  await updateDoc(itemRef, { quantity });
  await updateDoc(doc(db, 'carts', userId), { updatedAt: serverTimestamp() });
}

export async function removeCartItem(
  userId: string,
  productId: string
): Promise<void> {
  const itemRef = doc(db, 'carts', userId, 'items', productId);
  await deleteDoc(itemRef);
  await updateDoc(doc(db, 'carts', userId), { updatedAt: serverTimestamp() });
}

export async function clearCart(userId: string): Promise<void> {
  const itemsRef = collection(db, 'carts', userId, 'items');
  const snapshot = await getDocs(itemsRef);
  const deletePromises = snapshot.docs.map((d) => deleteDoc(d.ref));
  await Promise.all(deletePromises);
}
