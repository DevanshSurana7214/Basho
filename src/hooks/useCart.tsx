import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CartProduct {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  weight_kg?: number;
}

interface CartWorkshop {
  id: string;
  title: string;
  price: number;
  image_url?: string;
  duration?: string;
}

interface CartItem {
  id: string;
  product_id?: string;
  workshop_id?: string;
  quantity: number;
  item_type: 'product' | 'workshop';
  product?: CartProduct;
  workshop?: CartWorkshop;
}

interface CartContextType {
  items: CartItem[];
  loading: boolean;
  addToCart: (item: { 
    productId?: string; 
    workshopId?: string; 
    itemType: 'product' | 'workshop';
    product?: CartProduct;
    workshop?: CartWorkshop;
  }) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  getTotal: () => number;
  getShippingCost: () => number;
  itemCount: number;
  sessionId: string;
  isGuest: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'basho_guest_cart';

const getOrCreateSessionId = (): string => {
  let sessionId = localStorage.getItem('cart_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('cart_session_id', sessionId);
  }
  return sessionId;
};

const getStoredCart = (): CartItem[] => {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveLocalCart = (items: CartItem[]) => {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [hasSynced, setHasSynced] = useState(false);
  const sessionId = getOrCreateSessionId();

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const newUserId = session?.user?.id || null;
      
      // If logging out, reset sync flag and load local cart
      if (!newUserId && userId) {
        setHasSynced(false);
        setItems(getStoredCart());
      }
      
      setUserId(newUserId);
    });

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, [userId]);

  // Fetch cart based on auth state
  const fetchCart = useCallback(async () => {
    if (userId) {
      // Logged in - fetch from Supabase
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          id,
          product_id,
          workshop_id,
          quantity,
          item_type,
          products:product_id (id, name, price, image_url, weight_kg),
          workshops:workshop_id (id, title, price, image_url, duration)
        `)
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching cart:', error);
      } else {
        const formattedItems: CartItem[] = data?.map(item => ({
          id: item.id,
          product_id: item.product_id ?? undefined,
          workshop_id: item.workshop_id ?? undefined,
          quantity: item.quantity,
          item_type: item.item_type as 'product' | 'workshop',
          product: item.products as CartProduct,
          workshop: item.workshops as CartWorkshop,
        })) || [];
        setItems(formattedItems);
      }
    } else {
      // Guest - load from localStorage
      setItems(getStoredCart());
    }
    setLoading(false);
  }, [userId]);

  // Sync local cart to Supabase when user logs in
  const syncLocalCartToUser = useCallback(async () => {
    const localCart = getStoredCart();
    if (localCart.length === 0 || !userId || hasSynced) return;

    try {
      // Get existing cart items for user
      const { data: existingItems } = await supabase
        .from('cart_items')
        .select('product_id, workshop_id')
        .eq('user_id', userId);

      const existingProductIds = new Set(existingItems?.filter(i => i.product_id).map(i => i.product_id));
      const existingWorkshopIds = new Set(existingItems?.filter(i => i.workshop_id).map(i => i.workshop_id));

      // Filter out items that already exist
      const newItems = localCart.filter(item => {
        if (item.item_type === 'product' && item.product_id) {
          return !existingProductIds.has(item.product_id);
        }
        if (item.item_type === 'workshop' && item.workshop_id) {
          return !existingWorkshopIds.has(item.workshop_id);
        }
        return false;
      });

      if (newItems.length > 0) {
        const insertData = newItems.map(item => ({
          session_id: sessionId,
          user_id: userId,
          product_id: item.product_id || null,
          workshop_id: item.workshop_id || null,
          item_type: item.item_type,
          quantity: item.quantity,
        }));

        await supabase.from('cart_items').insert(insertData);
        toast.success(`${newItems.length} item(s) synced to your cart`);
      }

      // Clear local storage after sync
      localStorage.removeItem(CART_STORAGE_KEY);
      setHasSynced(true);
    } catch (error) {
      console.error('Error syncing cart:', error);
    }
  }, [userId, sessionId, hasSynced]);

  // Initial fetch and sync
  useEffect(() => {
    if (userId && !hasSynced) {
      syncLocalCartToUser().then(() => fetchCart());
    } else {
      fetchCart();
    }
  }, [userId, hasSynced, syncLocalCartToUser, fetchCart]);

  const addToCart = async ({ productId, workshopId, itemType, product, workshop }: { 
    productId?: string; 
    workshopId?: string; 
    itemType: 'product' | 'workshop';
    product?: CartProduct;
    workshop?: CartWorkshop;
  }) => {
    if (userId) {
      // Logged in - use Supabase
      const existingItem = items.find(item => 
        (itemType === 'product' && item.product_id === productId) ||
        (itemType === 'workshop' && item.workshop_id === workshopId)
      );

      if (existingItem) {
        if (itemType === 'product') {
          await updateQuantity(existingItem.id, existingItem.quantity + 1);
        } else {
          toast.info('Workshop already in cart');
        }
        return;
      }

      const { error } = await supabase.from('cart_items').insert({
        session_id: sessionId,
        user_id: userId,
        product_id: productId || null,
        workshop_id: workshopId || null,
        item_type: itemType,
        quantity: 1,
      });

      if (error) {
        console.error('Error adding to cart:', error);
        toast.error('Failed to add item to cart');
      } else {
        toast.success('Added to cart');
        fetchCart();
      }
    } else {
      // Guest - use localStorage
      setItems(prev => {
        const existingIndex = prev.findIndex(item => 
          (itemType === 'product' && item.product_id === productId) ||
          (itemType === 'workshop' && item.workshop_id === workshopId)
        );

        if (existingIndex >= 0) {
          if (itemType === 'product') {
            const updated = [...prev];
            updated[existingIndex] = {
              ...updated[existingIndex],
              quantity: updated[existingIndex].quantity + 1,
            };
            toast.success('Added to cart');
            saveLocalCart(updated);
            return updated;
          } else {
            toast.info('Workshop already in cart');
            return prev;
          }
        }

        const newItem: CartItem = {
          id: crypto.randomUUID(),
          product_id: productId,
          workshop_id: workshopId,
          quantity: 1,
          item_type: itemType,
          product,
          workshop,
        };

        toast.success('Added to cart');
        const updated = [...prev, newItem];
        saveLocalCart(updated);
        return updated;
      });
    }
  };

  const removeFromCart = async (itemId: string) => {
    if (userId) {
      const { error } = await supabase.from('cart_items').delete().eq('id', itemId);
      if (error) {
        console.error('Error removing from cart:', error);
        toast.error('Failed to remove item');
      } else {
        fetchCart();
      }
    } else {
      setItems(prev => {
        const updated = prev.filter(item => item.id !== itemId);
        saveLocalCart(updated);
        return updated;
      });
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(itemId);
      return;
    }

    if (userId) {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', itemId);

      if (error) {
        console.error('Error updating quantity:', error);
      } else {
        fetchCart();
      }
    } else {
      setItems(prev => {
        const updated = prev.map(item => 
          item.id === itemId ? { ...item, quantity } : item
        );
        saveLocalCart(updated);
        return updated;
      });
    }
  };

  const clearCart = async () => {
    if (userId) {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Error clearing cart:', error);
      } else {
        setItems([]);
      }
    } else {
      setItems([]);
      localStorage.removeItem(CART_STORAGE_KEY);
    }
  };

  const getTotal = () => {
    return items.reduce((total, item) => {
      const price = item.product?.price || item.workshop?.price || 0;
      return total + (price * item.quantity);
    }, 0);
  };

  const getShippingCost = () => {
    const totalWeight = items.reduce((weight, item) => {
      if (item.product?.weight_kg) {
        return weight + (item.product.weight_kg * item.quantity);
      }
      return weight;
    }, 0);
    return Math.ceil(totalWeight) * 100;
  };

  const itemCount = items.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      items,
      loading,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getTotal,
      getShippingCost,
      itemCount,
      sessionId,
      isGuest: !userId,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
