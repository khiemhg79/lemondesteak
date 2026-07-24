import { CheckCircle2, XCircle } from 'lucide-react';
import './cart.css';

export default function OrderResultDialog({ open, type, message, onClose }) {
    if (!open) return null;

    const isSuccess = type === 'success';

    return (
        <div className="order-result-backdrop">
            <div className="order-result-dialog">
                <div
                    className={
                        isSuccess
                            ? 'order-result-icon success'
                            : 'order-result-icon error'
                    }
                >
                    {isSuccess ? <CheckCircle2 size={30} /> : <XCircle size={30} />}
                </div>

                <h3>{isSuccess ? 'Đặt món thành công' : 'Đặt món thất bại'}</h3>

                <p>{message}</p>

                <button type="button" onClick={onClose}>
                    Đóng
                </button>
            </div>
        </div>
    );
}