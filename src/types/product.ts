import { Timestamp } from 'firebase/firestore';

export interface Product {
  id: string;
  name: string;
  description: string;
  nameAr?: string;
  descriptionAr?: string;
  nameEn?: string;
  descriptionEn?: string;
  price: number;
  discountPrice: number;
  categoryId: string;
  image: string;
  images?: string[];
  stock: number;
  status: 'active' | 'inactive';
  featured: boolean;
  ratingAverage?: number;
  ratingCount?: number;
  imageFit?: 'contain' | 'cover';
  imageScale?: number;
  imagePositionX?: number;
  imagePositionY?: number;
  imageBg?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ProductForm {
  name: string;
  description: string;
  nameAr?: string;
  descriptionAr?: string;
  nameEn?: string;
  descriptionEn?: string;
  price: number;
  discountPrice: number;
  categoryId: string;
  image: string;
  images: string[];
  stock: number;
  status: 'active' | 'inactive';
  featured: boolean;
  imageFit?: 'contain' | 'cover';
  imageScale?: number;
  imagePositionX?: number;
  imagePositionY?: number;
  imageBg?: string;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  rating: number;
  comment: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ReviewForm {
  rating: number;
  comment: string;
}
