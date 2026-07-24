export const STORAGE_KEY = 'lemondesteak_customer_auth';
export const LAST_TABLE_KEY = 'lemondesteak_last_table';

export function getApiUrl() {
  const envApiUrl = import.meta.env.VITE_API_URL;
  const isPhoneViaLan = !['localhost', '127.0.0.1'].includes(
    window.location.hostname
  );

  if (isPhoneViaLan && envApiUrl?.includes('localhost')) {
    return `${window.location.protocol}//${window.location.hostname}:8080`;
  }

  return (
    envApiUrl ||
    `${window.location.protocol}//${window.location.hostname}:8080`
  );
}