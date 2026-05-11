import { Timestamp } from 'firebase/firestore';

export interface Category {
  id: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
  slug: string;
  image: string;
  createdAt: Timestamp;
}

export interface CategoryForm {
  name: string;
  nameAr?: string;
  nameEn?: string;
  slug: string;
  image: string;
}
