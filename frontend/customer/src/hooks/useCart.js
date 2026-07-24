import { useMemo, useState } from 'react';
import {
    calculateCartSummary,
    getCartLineKey
} from '../utils/cart.js';

const CART_STORAGE_KEY = 'lemondesteak_active_cart';

function readInitialCart() {
    try {
        const saved = localStorage.getItem(CART_STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch {
        return [];
    }
}

function persistCart(cart) {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

export function useCart(toast) {
    const [cart, setCartState] = useState(readInitialCart);

    const setCart = (updater) => {
        setCartState((currentCart) => {
            const nextCart =
                typeof updater === 'function' ? updater(currentCart) : updater;

            persistCart(nextCart);

            return nextCart;
        });
    };

    const addToCart = (line) => {
        if (!line?.id) {
            toast?.('Không thể thêm món vào giỏ hàng.');
            return;
        }

        const nextLine = {
            type: line.type || 'item',
            id: line.id,
            name: line.name || 'Món ăn',
            price: Number(line.price || 0),
            image: line.image || '',
            quantity: 1
        };

        setCart((currentCart) => {
            const lineKey = getCartLineKey(nextLine);
            const existedLine = currentCart.find(
                (item) => getCartLineKey(item) === lineKey
            );

            if (!existedLine) {
                return [...currentCart, nextLine];
            }

            return currentCart.map((item) =>
                getCartLineKey(item) === lineKey
                    ? {
                        ...item,
                        quantity: Number(item.quantity || 0) + 1
                    }
                    : item
            );
        });

        toast?.('Đã thêm món vào giỏ hàng.');
    };

    const changeQty = (line, delta) => {
        const lineKey = getCartLineKey(line);

        setCart((currentCart) =>
            currentCart
                .map((item) =>
                    getCartLineKey(item) === lineKey
                        ? {
                            ...item,
                            quantity: Number(item.quantity || 0) + delta
                        }
                        : item
                )
                .filter((item) => item.quantity > 0)
        );
    };

    const removeLine = (line) => {
        const lineKey = getCartLineKey(line);

        setCart((currentCart) =>
            currentCart.filter((item) => getCartLineKey(item) !== lineKey)
        );

        toast?.('Đã xóa món khỏi giỏ hàng.');
    };

    const clearCart = () => {
        setCart([]);
        toast?.('Đã xóa giỏ hàng.');
    };

    const resetCartAfterOrder = () => {
        setCart([]);
    };

    const summary = useMemo(() => {
        return calculateCartSummary(cart, null);
    }, [cart]);

    return {
        cart,
        subTotal: summary.subTotal,
        cartCount: summary.cartCount,
        addToCart,
        changeQty,
        removeLine,
        clearCart,
        resetCartAfterOrder
    };
}