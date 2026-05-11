import {
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  collection,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Product, ProductForm } from '../types/product';

export async function getAllProducts(): Promise<Product[]> {
  const snapshot = await getDocs(collection(db, 'products'));
  const products = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
  return products.sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() || 0;
    const bTime = b.createdAt?.toMillis?.() || 0;
    return bTime - aTime;
  });
}

export async function getActiveProducts(): Promise<Product[]> {
  const snapshot = await getDocs(collection(db, 'products'));
  const products = snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() } as Product))
    .filter((p) => p.status === 'active');
  return products.sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() || 0;
    const bTime = b.createdAt?.toMillis?.() || 0;
    return bTime - aTime;
  });
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const snapshot = await getDocs(collection(db, 'products'));
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() } as Product))
    .filter((p) => p.status === 'active' && p.featured === true);
}

export async function getProductById(id: string): Promise<Product | null> {
  const docRef = doc(db, 'products', id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Product;
  }
  return null;
}

export async function getProductsByCategory(categoryId: string): Promise<Product[]> {
  const snapshot = await getDocs(collection(db, 'products'));
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() } as Product))
    .filter((p) => p.categoryId === categoryId && p.status === 'active');
}

/**
 * Get related products from same category, excluding the current product.
 * Sorted by: featured first, then newest.
 */
export async function getRelatedProducts(
  categoryId: string,
  excludeProductId: string,
  limit: number = 8
): Promise<Product[]> {
  const snapshot = await getDocs(collection(db, 'products'));
  const products = snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() } as Product))
    .filter(
      (p) =>
        p.categoryId === categoryId &&
        p.id !== excludeProductId &&
        p.status === 'active'
    );

  // Sort: featured first, then by newest
  products.sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    const aTime = a.createdAt?.toMillis?.() || 0;
    const bTime = b.createdAt?.toMillis?.() || 0;
    return bTime - aTime;
  });

  return products.slice(0, limit);
}

export async function createProduct(data: ProductForm): Promise<string> {
  const images = data.images?.filter((url) => url && url.trim() !== '') || [];
  const primaryImage = images[0] || data.image || '';

  const docRef = await addDoc(collection(db, 'products'), {
    ...data,
    image: primaryImage,
    images,
    price: Number(data.price),
    discountPrice: Number(data.discountPrice),
    stock: Number(data.stock),
    ratingAverage: 0,
    ratingCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateProduct(
  id: string,
  data: Partial<ProductForm>
): Promise<void> {
  const docRef = doc(db, 'products', id);
  const updateData: any = { ...data, updatedAt: serverTimestamp() };

  // Sync images array and primary image field
  if (data.images) {
    const filtered = data.images.filter((url) => url && url.trim() !== '');
    updateData.images = filtered;
    updateData.image = filtered[0] || data.image || '';
  }

  if (data.price !== undefined) updateData.price = Number(data.price);
  if (data.discountPrice !== undefined) updateData.discountPrice = Number(data.discountPrice);
  if (data.stock !== undefined) updateData.stock = Number(data.stock);
  await updateDoc(docRef, updateData);
}

export async function deleteProduct(id: string): Promise<void> {
  await deleteDoc(doc(db, 'products', id));
}

export async function toggleProductStatus(
  id: string,
  status: 'active' | 'inactive'
): Promise<void> {
  await updateDoc(doc(db, 'products', id), { status, updatedAt: serverTimestamp() });
}

export async function toggleProductFeatured(
  id: string,
  featured: boolean
): Promise<void> {
  await updateDoc(doc(db, 'products', id), { featured, updatedAt: serverTimestamp() });
}
