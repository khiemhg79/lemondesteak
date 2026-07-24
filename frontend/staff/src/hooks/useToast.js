import { useState } from 'react';

export function useToast() {
  const [toastText, setToastText] = useState('');
  const toast = (message) => {
    setToastText(message);
    setTimeout(() => setToastText(''), 3600);
  };
  return { toastText, toast };
}
