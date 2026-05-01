export interface User {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
  role: 'USER' | 'ADMIN';
  isActive: boolean;
  createdAt: string;
  avatar?: string;
}

export interface AuthResponse {
  token: string;
  email: string;
  fullName: string;
  role: string;
  userId: number;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
  createdAt: string;
  productCount: number;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  originalPrice?: number;
  price: number;
  discount?: number;
  imageUrl?: string;
  categoryId?: number;
  categoryName?: string;
  ingredients?: string;
  isAvailable: boolean;
  isFeatured: boolean;
  isNew: boolean;
  rating: number;
  soldCount: number;
  createdAt: string;
  reviewCount: number;
  stock?: number;
  images?: ProductImage[];
  variants?: ProductVariant[];
}

export interface ProductVariant {
  id?: number;
  name: string;
  sku?: string;
  originalPrice: number;
  salePrice: number;
  stock: number;
  isDefault: boolean;
  preparationTime: number; // <--- THÊM DÒNG NÀY
  attributes: ProductVariantAttribute[];
}

export interface ProductVariantAttribute {
  name: string;
  value: string;
}

export interface ProductImage {
  id?: number;
  url: string;
  isPrimary: boolean;
  type: 'IMAGE' | 'VIDEO';
}

export interface CartItem {
  id: number;
  productId: number;
  variantId?: number;
  variantName?: string;
  variantAttributes?: string;
  originalPrice?: number;
  productName: string;
  productImage?: string;
  productPrice: number;
  quantity: number;
  subtotal: number;
  preparationTime?: number; // ✅ Thêm dòng này (dấu ? nghĩa là có thể có hoặc không)
}

export interface Order {
  id: number;
  userId: number;
  userName: string;
  totalAmount: number;
  shippingFee: number;
  shippingAddress: string;
  shippingPhone: string;
  recipientName?: string;
  recipientPhone?: string;
  paymentMethod: 'COD' | 'VNPAY';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED';
  orderStatus?: 'PENDING' | 'CONFIRMED' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED';
  status?: 'PENDING' | 'CONFIRMED' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED';
  couponCode?: string;
  discount: number;
  createdAt: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: number;
  productId: number;
  variantId?: number;
  variantName?: string;
  variantAttributes?: string;
  originalPrice?: number;
  productName: string;
  productImage?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Review {
  id: number;
  productId: number;
  productName?: string;
  userId: number;
  userName: string;
  rating: number;
  comment?: string;
  adminReply?: string;
  repliedAt?: string;
  createdAt: string;
}

export interface Coupon {
  id: number;
  code: string;
  description?: string;
  discountPercent: number;
  minOrderAmount: number;
  maxDiscount?: number;
  usageLimit: number;
  usageCount?: number;
  expiryDate: string;
  isActive: boolean;
  productIds?: number[];
  applicableProducts?: Array<{ id: number; name: string }>;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface ShippingSetting {
  id: number;
  baseFee: number;
  freeShippingThreshold?: number;
  freeShippingEnabled: boolean;
}
