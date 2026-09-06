import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react";
import { useUser } from "./UserContext";
import { api, CartProduct, CartItem } from "@/lib/api";

export type { CartProduct, CartItem };

interface CartContextType {
  items: CartItem[];
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addWeightItem: (product: CartProduct, weightInGrams: number, qty?: number) => void;
  addVariantItem: (product: CartProduct, variantName: string, variantPrice: number, qty?: number) => void;
  removeFromCart: (cartItemId: string) => void;
  updateItemQty: (cartItemId: string, newQty: number) => void;
  clearCart: () => void;
  cartTotal: number;
  totalItems: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { user } = useUser();
  const isCartLoaded = useRef(false);
  const isLoadingCart = useRef(false);

  // Load cart from API when user is authenticated
  useEffect(() => {
    async function loadCart() {
      if (!user) {
        setItems([]);
        isCartLoaded.current = false;
        isLoadingCart.current = false;
        return;
      }

      if (isCartLoaded.current || isLoadingCart.current) return;
      isLoadingCart.current = true;

      try {
        const res = await api.cart.get();
        if (res.success && Array.isArray(res.items)) {
          const dbItems = res.items as CartItem[];

          setItems((currentLocalItems) => {
            if (currentLocalItems.length === 0) {
              isCartLoaded.current = true;
              return dbItems;
            }

            const merged = [...dbItems];
            currentLocalItems.forEach((localItem) => {
              const matchIndex = merged.findIndex((item) => item.cartItemId === localItem.cartItemId);
              if (matchIndex >= 0) {
                merged[matchIndex].qty += localItem.qty;
              } else {
                merged.push(localItem);
              }
            });

            api.cart.sync(merged).catch((err) => console.error("Error syncing merged cart:", err));
            isCartLoaded.current = true;
            return merged;
          });
        } else {
          isCartLoaded.current = true;
        }
      } catch (error) {
        console.error("Failed to load cart:", error);
        isCartLoaded.current = true;
      } finally {
        isLoadingCart.current = false;
      }
    }

    loadCart();
  }, [user]);

  // Sync to database via API whenever items change
  useEffect(() => {
    if (!isCartLoaded.current) return;

    if (user) {
      const timer = setTimeout(() => {
        api.cart.sync(items).catch((err) => console.error("Failed to sync cart:", err));
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [items, user]);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const addWeightItem = (product: CartProduct, weightInGrams: number, qty: number = 1) => {
    setItems((prevItems) => {
      const cartItemId = `${product.id}_${weightInGrams}`;
      const existingItemIndex = prevItems.findIndex((item) => item.cartItemId === cartItemId);

      if (existingItemIndex >= 0) {
        const updated = [...prevItems];
        updated[existingItemIndex].qty += qty;
        return updated;
      }
      return [...prevItems, { cartItemId, product, weightInGrams, qty }];
    });
  };

  const addVariantItem = (
    product: CartProduct,
    variantName: string,
    variantPrice: number,
    qty: number = 1
  ) => {
    setItems((prevItems) => {
      const cartItemId = `${product.id}_${variantName}`;
      const existingItemIndex = prevItems.findIndex((item) => item.cartItemId === cartItemId);

      if (existingItemIndex >= 0) {
        const updated = [...prevItems];
        updated[existingItemIndex].qty += qty;
        return updated;
      }
      return [...prevItems, { cartItemId, product, variantName, variantPrice, qty }];
    });
  };

  const removeFromCart = (cartItemId: string) => {
    setItems((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  };

  const updateItemQty = (cartItemId: string, newQty: number) => {
    if (newQty <= 0) return;
    setItems((prev) =>
      prev.map((item) => (item.cartItemId === cartItemId ? { ...item, qty: newQty } : item))
    );
  };

  const clearCart = () => {
    setItems([]);
    if (user) {
      api.cart.clear().catch(console.error);
    }
  };

  const cartTotal = items.reduce((total, item) => {
    if (item.product.priceType === "weight" && item.weightInGrams && item.product.pricePerKg) {
      return total + (item.weightInGrams / 1000) * item.product.pricePerKg * item.qty;
    } else if (item.product.priceType === "variant" && item.variantPrice) {
      return total + item.variantPrice * item.qty;
    }
    return total;
  }, 0);

  const totalItems = items.reduce((total, item) => total + item.qty, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        isCartOpen,
        openCart,
        closeCart,
        addWeightItem,
        addVariantItem,
        removeFromCart,
        updateItemQty,
        clearCart,
        cartTotal,
        totalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
