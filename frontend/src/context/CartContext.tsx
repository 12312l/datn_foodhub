import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { cartAPI } from '../services/api';
import { CartItem } from '../types';
import { useAuth } from './AuthContext';

interface CartContextType {
  items: CartItem[];
  total: number;
  itemCount: number;
  isLoading: boolean;
  addItem: (productId: number, quantity?: number, productInfo?: { name: string; price: number; imageUrl: string; variantId?: number; variantName?: string; variantAttributes?: string; originalPrice?: number }) => Promise<void>;
  updateItem: (cartItemId: number, quantity: number) => Promise<void>;
  removeItem: (cartItemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Local storage key for guest cart
const GUEST_CART_KEY = 'guest_cart';

interface GuestCartItem {
  id: number;
  productId: number;
  variantId?: number;
  quantity: number;
  product: {
    id: number;
    name: string;
    price: number;
    imageUrl: string;
    originalPrice?: number;
    variantName?: string;
    variantAttributes?: string;
  };
}

const getGuestCart = (): GuestCartItem[] => {
  try {
    const cart = localStorage.getItem(GUEST_CART_KEY);
    return cart ? JSON.parse(cart) : [];
  } catch {
    return [];
  }
};

const setGuestCart = (items: GuestCartItem[]) => {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
};

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [itemCount, setItemCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const refreshCart = async () => {
    if (!isAuthenticated) {
      // Use guest cart from localStorage
      const guestItems = getGuestCart();
      const guestCartItems: CartItem[] = guestItems.map(item => ({
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        variantName: item.product.variantName,
        variantAttributes: item.product.variantAttributes,
        originalPrice: item.product.originalPrice,
        productName: item.product.name,
        productImage: item.product.imageUrl,
        productPrice: item.product.price,
        quantity: item.quantity,
        subtotal: item.product.price * item.quantity
      }));
      setItems(guestCartItems);
      const cartTotal = guestItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
      setTotal(cartTotal);
      setItemCount(guestItems.reduce((sum, item) => sum + item.quantity, 0));
      return;
    }

    try {
      const response = await cartAPI.getItems();
      setItems(response.data);
      const totalResponse = await cartAPI.getTotal();
      setTotal(totalResponse.data.total || 0);
      setItemCount(response.data.reduce((sum: number, item: CartItem) => sum + item.quantity, 0));
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  };

  useEffect(() => {
    refreshCart();
  }, [isAuthenticated]);

  const addItem = async (productId: number, quantity = 1, productInfo?: { name: string; price: number; imageUrl: string; variantId?: number; variantName?: string; variantAttributes?: string; originalPrice?: number }) => {
    setIsLoading(true);
    try {
      if (!isAuthenticated) {
        // Add to guest cart
        const guestCart = getGuestCart();
        const existingIndex = guestCart.findIndex(item => item.productId === productId && item.variantId === productInfo?.variantId);

        if (existingIndex >= 0) {
          guestCart[existingIndex].quantity += quantity;
        } else {
          const generatedId = Date.now() + Math.floor(Math.random() * 1000);
          guestCart.push({
            id: generatedId,
            productId,
            variantId: productInfo?.variantId,
            quantity,
            product: productInfo ? {
              id: productId,
              ...productInfo
            } : {
              id: productId,
              name: 'Sản phẩm',
              price: 0,
              imageUrl: '',
              originalPrice: 0,
              variantName: undefined,
              variantAttributes: undefined,
            }
          });
        }

        setGuestCart(guestCart);
        await refreshCart();
      } else {
        await cartAPI.addItem(productId, quantity, productInfo?.variantId);
        await refreshCart();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateItem = async (cartItemId: number, quantity: number) => {
    setIsLoading(true);
    try {
      if (!isAuthenticated) {
        const guestCart = getGuestCart();
        if (quantity <= 0) {
          const filtered = guestCart.filter(item => item.id !== cartItemId);
          setGuestCart(filtered);
        } else {
          const index = guestCart.findIndex(item => item.id === cartItemId);
          if (index >= 0) {
            guestCart[index].quantity = quantity;
            setGuestCart(guestCart);
          }
        }
        await refreshCart();
      } else {
        await cartAPI.updateItem(cartItemId, quantity);
        await refreshCart();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const removeItem = async (cartItemId: number) => {
    setIsLoading(true);
    try {
      if (!isAuthenticated) {
        const guestCart = getGuestCart();
        const filtered = guestCart.filter(item => item.id !== cartItemId);
        setGuestCart(filtered);
        await refreshCart();
      } else {
        await cartAPI.removeItem(cartItemId);
        await refreshCart();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async () => {
    setIsLoading(true);
    try {
      if (!isAuthenticated) {
        setGuestCart([]);
        setItems([]);
        setTotal(0);
        setItemCount(0);
      } else {
        await cartAPI.clear();
        setItems([]);
        setTotal(0);
        setItemCount(0);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        items,
        total,
        itemCount,
        isLoading,
        addItem,
        updateItem,
        removeItem,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};
