import { money } from './format.js';

export function getVoucherCode(voucher) {
    return voucher?.code || voucher?.promoCode || voucher?.name || 'VOUCHER';
}

export function getVoucherDiscountText(voucher) {
    if (!voucher) return '';

    const type = String(voucher.type || '').toUpperCase();
    const value = Number(voucher.value || 0);

    if (type.includes('PERCENT')) {
        return `Giảm ${value}%`;
    }

    return `Giảm ${money(value)}`;
}

export function getVoucherConditionText(voucher) {
    if (!voucher) return '';

    const minOrderAmount = Number(voucher.minOrderAmount || 0);
    const maxDiscount = Number(voucher.maxDiscount || 0);

    const conditions = [];

    if (minOrderAmount > 0) {
        conditions.push(`Đơn tối thiểu ${money(minOrderAmount)}`);
    }

    if (maxDiscount > 0) {
        conditions.push(`Giảm tối đa ${money(maxDiscount)}`);
    }

    return conditions.length ? conditions.join(' · ') : 'Không yêu cầu giá trị tối thiểu';
}

export function getVoucherDateText(voucher) {
    if (!voucher?.endDate) return 'Không giới hạn ngày hết hạn';

    const date = new Date(voucher.endDate);

    if (Number.isNaN(date.getTime())) {
        return 'Không giới hạn ngày hết hạn';
    }

    return `Hết hạn: ${date.toLocaleDateString('vi-VN')}`;
}

export function isVoucherExpired(voucher) {
    if (!voucher?.endDate) return false;

    const endDate = new Date(voucher.endDate);

    if (Number.isNaN(endDate.getTime())) return false;

    return endDate.getTime() < Date.now();
}

export function isVoucherNotStarted(voucher) {
    if (!voucher?.startDate) return false;

    const startDate = new Date(voucher.startDate);

    if (Number.isNaN(startDate.getTime())) return false;

    return startDate.getTime() > Date.now();
}

export function isVoucherUsageLimitReached(voucher) {
    const usageLimit = voucher?.usageLimit;
    const usedCount = Number(voucher?.usedCount || 0);

    if (usageLimit === null || usageLimit === undefined || usageLimit === '') {
        return false;
    }

    return usedCount >= Number(usageLimit);
}

export function getVoucherStatus(voucher, subTotal) {
    if (!voucher) {
        return {
            usable: false,
            label: 'Không hợp lệ',
            message: 'Mã giảm giá không hợp lệ.'
        };
    }

    if (voucher.isActive === false) {
        return {
            usable: false,
            label: 'Ngừng áp dụng',
            message: 'Mã giảm giá không còn hoạt động.'
        };
    }

    if (isVoucherNotStarted(voucher)) {
        return {
            usable: false,
            label: 'Chưa bắt đầu',
            message: 'Mã giảm giá chưa đến thời gian áp dụng.'
        };
    }

    if (isVoucherExpired(voucher)) {
        return {
            usable: false,
            label: 'Hết hạn',
            message: 'Mã giảm giá đã hết hạn.'
        };
    }

    if (isVoucherUsageLimitReached(voucher)) {
        return {
            usable: false,
            label: 'Hết lượt',
            message: 'Mã giảm giá đã hết lượt sử dụng.'
        };
    }

    const minOrderAmount = Number(voucher.minOrderAmount || 0);

    if (minOrderAmount > 0 && Number(subTotal || 0) < minOrderAmount) {
        return {
            usable: false,
            label: 'Chưa đủ điều kiện',
            message: `Đơn hàng cần đạt tối thiểu ${money(minOrderAmount)} để áp dụng mã này.`
        };
    }

    return {
        usable: true,
        label: 'Có thể áp dụng',
        message: 'Mã giảm giá hợp lệ.'
    };
}

export function filterUsableVouchers(vouchers = []) {
    return vouchers.filter((voucher) => {
        if (!voucher) return false;
        if (voucher.isActive === false) return false;
        if (isVoucherExpired(voucher)) return false;
        if (isVoucherNotStarted(voucher)) return false;
        if (isVoucherUsageLimitReached(voucher)) return false;

        return true;
    });
}