export const QR_EXPIRE_HOURS = 12;
export const QR_EXPIRE_MS = QR_EXPIRE_HOURS * 60 * 60 * 1000;

export function getCustomerBaseUrl() {
    const { protocol, hostname } = window.location;

    return `${protocol}//${hostname}:5173`;
}

export function getQrTableCodeFromUrl() {
    const pathMatch = window.location.pathname.match(/^\/t\/([^/]+)/);
    const params = new URLSearchParams(window.location.search);

    return decodeURIComponent(
        pathMatch?.[1] ||
        params.get('tableId') ||
        params.get('table') ||
        localStorage.getItem('lemondesteak_last_table') ||
        ''
    );
}

export function getQrCreatedAtFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const qrAt = params.get('qrAt');

    if (!qrAt) return null;

    const timestamp = Number(qrAt);

    if (!Number.isFinite(timestamp)) return null;

    return timestamp;
}

export function isQrExpired() {
    const qrAt = getQrCreatedAtFromUrl();

    if (!qrAt) return false;

    return Date.now() - qrAt > QR_EXPIRE_MS;
}