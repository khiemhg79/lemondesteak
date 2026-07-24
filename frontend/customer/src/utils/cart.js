export function getCartLineKey(line) {
    return `${line.type || 'item'}-${line.id}`;
}

export function calculateSubTotal(cart = []) {
    return cart.reduce((sum, line) => {
        return sum + Number(line.price || 0) * Number(line.quantity || 0);
    }, 0);
}

export function calculateCartCount(cart = []) {
    return cart.reduce((sum, line) => {
        return sum + Number(line.quantity || 0);
    }, 0);
}

export function calculatePromotionDiscount(subTotal, promotion) {
    if (!promotion) return 0;

    const total = Number(subTotal || 0);
    const minOrderAmount = Number(promotion.minOrderAmount || 0);

    if (total <= 0) return 0;
    if (minOrderAmount > 0 && total < minOrderAmount) return 0;

    const type = String(promotion.type || '').toUpperCase();
    const value = Number(promotion.value || 0);
    const maxDiscount = Number(promotion.maxDiscount || 0);

    let discount = 0;

    if (type.includes('PERCENT')) {
        discount = (total * value) / 100;
    } else {
        discount = value;
    }

    if (maxDiscount > 0) {
        discount = Math.min(discount, maxDiscount);
    }

    return Math.max(0, Math.min(discount, total));
}

export function calculateCartSummary(cart = [], promotion = null) {
    const subTotal = calculateSubTotal(cart);
    const discountAmount = calculatePromotionDiscount(subTotal, promotion);
    const totalAmount = Math.max(0, subTotal - discountAmount);

    return {
        subTotal,
        discountAmount,
        totalAmount,
        cartCount: calculateCartCount(cart)
    };
}

export function isPromotionUsable(subTotal, promotion) {
    if (!promotion) return false;

    const minOrderAmount = Number(promotion.minOrderAmount || 0);

    if (minOrderAmount <= 0) return true;

    return Number(subTotal || 0) >= minOrderAmount;
}