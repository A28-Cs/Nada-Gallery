import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Review } from '../types/product';

/**
 * Get all reviews for a product, sorted by newest first.
 */
export async function getProductReviews(productId: string): Promise<Review[]> {
  const reviewsRef = collection(db, 'products', productId, 'reviews');
  const snapshot = await getDocs(reviewsRef);
  const reviews = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Review));
  return reviews.sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() || 0;
    const bTime = b.createdAt?.toMillis?.() || 0;
    return bTime - aTime;
  });
}

/**
 * Get the current user's review for a product (if exists).
 */
export async function getUserReview(
  productId: string,
  userId: string
): Promise<Review | null> {
  const reviewRef = doc(db, 'products', productId, 'reviews', userId);
  const snap = await getDoc(reviewRef);
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() } as Review;
  }
  return null;
}

/**
 * Create or update a review. Uses userId as the document ID to enforce one review per user.
 */
export async function submitReview(
  productId: string,
  userId: string,
  userName: string,
  userEmail: string,
  rating: number,
  comment: string
): Promise<void> {
  const reviewRef = doc(db, 'products', productId, 'reviews', userId);
  const existing = await getDoc(reviewRef);

  if (existing.exists()) {
    // Update existing review
    await updateDoc(reviewRef, {
      rating,
      comment,
      updatedAt: serverTimestamp(),
    });
  } else {
    // Create new review
    await setDoc(reviewRef, {
      userId,
      userName,
      userEmail,
      rating,
      comment,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  // Recalculate aggregate ratings (best-effort — review is already saved)
  try {
    await recalculateProductRating(productId);
  } catch (err) {
    console.warn('Rating aggregation failed (review was saved):', err);
  }
}

/**
 * Delete a review.
 */
export async function deleteReview(
  productId: string,
  reviewId: string
): Promise<void> {
  await deleteDoc(doc(db, 'products', productId, 'reviews', reviewId));
  try {
    await recalculateProductRating(productId);
  } catch (err) {
    console.warn('Rating aggregation failed after delete:', err);
  }
}

/**
 * Recalculate the average rating and count for a product.
 */
async function recalculateProductRating(productId: string): Promise<void> {
  const reviewsRef = collection(db, 'products', productId, 'reviews');
  const snapshot = await getDocs(reviewsRef);

  const reviews = snapshot.docs.map((d) => d.data());
  const ratingCount = reviews.length;
  const ratingAverage =
    ratingCount > 0
      ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / ratingCount
      : 0;

  const productRef = doc(db, 'products', productId);
  await updateDoc(productRef, {
    ratingAverage: Math.round(ratingAverage * 10) / 10,
    ratingCount,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Check if a user has purchased a specific product (for purchase-gating reviews).
 */
export async function hasUserPurchasedProduct(
  userId: string,
  productId: string
): Promise<boolean> {
  const ordersRef = collection(db, 'orders');
  const q = query(ordersRef, where('userId', '==', userId));
  const snapshot = await getDocs(q);

  console.log(`[hasUserPurchasedProduct] Found ${snapshot.docs.length} orders for user ${userId}, checking for product ${productId}`);

  for (const orderDoc of snapshot.docs) {
    const orderData = orderDoc.data();
    const items = orderData.items || [];
    const productIds = items.map((item: any) => item.productId);
    console.log(`[hasUserPurchasedProduct] Order ${orderDoc.id} items:`, productIds);
    if (items.some((item: any) => item.productId === productId)) {
      return true;
    }
  }
  return false;
}
