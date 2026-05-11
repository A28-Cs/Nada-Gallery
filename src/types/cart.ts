import { Timestamp } from 'firebase/firestore';

export interface CartItem {
  productId: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Cart {
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
