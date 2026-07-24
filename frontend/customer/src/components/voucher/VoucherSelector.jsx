import { TicketPercent, X } from 'lucide-react';
import {
    getVoucherCode,
    getVoucherConditionText,
    getVoucherDateText,
    getVoucherDiscountText,
    getVoucherStatus
} from '../../utils/voucher.js';
import './voucher.css';

export default function VoucherSelector({
    auth,
    vouchers,
    selectedVoucherId,
    setSelectedVoucherId,
    subTotal,
    onToast
}) {
    const selectedVoucher =
        vouchers.find((voucher) => voucher.id === selectedVoucherId) || null;

    const selectVoucher = (voucher) => {
        const status = getVoucherStatus(voucher, subTotal);

        if (!status.usable) {
            onToast?.(status.message);
            return;
        }

        setSelectedVoucherId(voucher.id);
        onToast?.(`Đã áp dụng voucher: ${getVoucherCode(voucher)}`);
    };

    const removeVoucher = () => {
        setSelectedVoucherId('');
        onToast?.('Đã bỏ mã giảm giá.');
    };

    return (
        <section className="voucher-box">
            <div className="voucher-head">
                <div>
                    <h3>
                        <TicketPercent size={18} />
                        Chọn mã giảm giá
                    </h3>

                    <p>
                        {auth
                            ? 'Danh sách voucher hợp lệ mà khách hàng có thể áp dụng.'
                            : 'Đăng nhập để xem và chọn voucher.'}
                    </p>
                </div>

                {selectedVoucher && (
                    <button className="voucher-remove" type="button" onClick={removeVoucher}>
                        <X size={15} />
                        Bỏ chọn
                    </button>
                )}
            </div>

            {!auth ? (
                <div className="voucher-empty">
                    Khách hàng cần đăng nhập để xem danh sách mã giảm giá.
                </div>
            ) : vouchers.length === 0 ? (
                <div className="voucher-empty">Không có mã giảm giá khả dụng.</div>
            ) : (
                <div className="voucher-list">
                    {vouchers.map((voucher) => {
                        const status = getVoucherStatus(voucher, subTotal);
                        const active = selectedVoucherId === voucher.id;

                        return (
                            <article
                                key={voucher.id}
                                className={
                                    active
                                        ? 'voucher-card active'
                                        : status.usable
                                            ? 'voucher-card'
                                            : 'voucher-card disabled'
                                }
                            >
                                <div className="voucher-main">
                                    <div>
                                        <strong>{getVoucherCode(voucher)}</strong>
                                        <span>{getVoucherDiscountText(voucher)}</span>
                                    </div>

                                    <button
                                        type="button"
                                        disabled={!status.usable}
                                        onClick={() => selectVoucher(voucher)}
                                    >
                                        {active ? 'Đã áp dụng' : 'Áp dụng'}
                                    </button>
                                </div>

                                <p>{voucher.description || 'Mã giảm giá từ Lemonde Steak.'}</p>

                                <div className="voucher-meta">
                                    <span>{getVoucherConditionText(voucher)}</span>
                                    <span>{getVoucherDateText(voucher)}</span>
                                </div>

                                <div
                                    className={
                                        status.usable ? 'voucher-status success' : 'voucher-status warning'
                                    }
                                >
                                    {status.label}
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </section>
    );
}