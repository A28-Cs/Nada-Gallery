import {
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  collection,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Category, CategoryForm } from '../types/category';

export async function getAllCategories(): Promise<Category[]> {
  const snapshot = await getDocs(collection(db, 'categories'));
  const categories = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Category));
  return categories.sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() || 0;
    const bTime = b.createdAt?.toMillis?.() || 0;
    return bTime - aTime;
  });
}

export async function createCategory(data: CategoryForm): Promise<string> {
  const docRef = await addDoc(collection(db, 'categories'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateCategory(
  id: string,
  data: Partial<CategoryForm>
): Promise<void> {
  const docRef = doc(db, 'categories', id);
  await updateDoc(docRef, { ...data });
}

export async function deleteCategory(id: string): Promise<void> {
  await deleteDoc(doc(db, 'categories', id));
}
