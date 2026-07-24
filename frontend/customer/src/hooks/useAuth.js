import { useState } from 'react';
import { STORAGE_KEY } from '../config/constants.js';

export function useAuth() {
  const [auth, setAuthState] = useState(() =>
    JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
  );

  const setAuth = (value) => {
    if (value) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }

    setAuthState(value);
  };

  return { auth, setAuth };
}
