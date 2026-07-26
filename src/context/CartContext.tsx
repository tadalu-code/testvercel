"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useSession } from "next-auth/react";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  salePrice?: number | null;
  image?: string;
  slug: string;
  categorySlug?: string;
  unit?: string | null;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
  addItem: (product: Omit<CartItem, "quantity">, qty?: number) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [cartKey, setCartKey] = useState("cart_guest");

  const { data: session } = useSession();

  // Theo dõi trạng thái đăng nhập để lấy ID người dùng làm key lưu giỏ hàng
  useEffect(() => {
    const userId = (session?.user as any)?.id;
    setCartKey(userId ? `cart_${userId}` : "cart_guest");
  }, [session]);

  // Load giỏ hàng từ localStorage khi cartKey thay đổi (ví dụ: vừa đăng nhập xong)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(cartKey);
      if (saved) {
        setItems(JSON.parse(saved));
      } else {
        setItems([]); // Nếu người dùng mới chưa có giỏ hàng thì làm trống
      }
    } catch {}
  }, [cartKey]);

  // Lưu vào localStorage mỗi khi items hoặc cartKey thay đổi
  useEffect(() => {
    localStorage.setItem(cartKey, JSON.stringify(items));
  }, [items, cartKey]);

  const addItem = (product: Omit<CartItem, "quantity">, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + qty } : i
        );
      }
      return [...prev, { ...product, quantity: qty }];
    });
    setIsOpen(true); // Tự mở drawer khi thêm hàng
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateQty = (id: string, qty: number) => {
    if (qty <= 0) {
      removeItem(id);
      return;
    }
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: qty } : i)));
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalAmount = items.reduce(
    (sum, i) => sum + (i.salePrice ?? i.price) * i.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        totalAmount,
        addItem,
        removeItem,
        updateQty,
        clearCart,
        isOpen,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart phải dùng trong CartProvider");
  return ctx;
}
