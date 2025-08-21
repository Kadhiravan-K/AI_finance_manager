import { useState, useEffect, useCallback } from 'react';
import { encrypt, decrypt } from '../utils/crypto';

function useLocalStorage<T>(key: string, initialValue: T | (() => T)): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue instanceof Function ? initialValue() : initialValue);

  // useEffect to load and decrypt data from localStorage on mount
  useEffect(() => {
    let isMounted = true;
    const loadAndDecrypt = async () => {
      try {
        const item = window.localStorage.getItem(key);
        if (item) {
          const decryptedValue = await decrypt(item);
          if (isMounted) {
            setStoredValue(decryptedValue as T);
          }
        } else {
            // If no item, encrypt and store the initial value for future use
             const valueToStore = initialValue instanceof Function ? initialValue() : initialValue;
             const encryptedValue = await encrypt(valueToStore);
             window.localStorage.setItem(key, encryptedValue);
        }
      } catch (error) {
        console.error(`Error decrypting data for key "${key}":`, error);
        // If decryption fails, we might be dealing with old unencrypted data or corruption.
        // For this app, we will overwrite with the initial value.
        const valueToStore = initialValue instanceof Function ? initialValue() : initialValue;
        const encryptedValue = await encrypt(valueToStore);
        window.localStorage.setItem(key, encryptedValue);
      }
    };
    
    loadAndDecrypt();

    return () => {
      isMounted = false;
    };
  }, [key]); // Only run on mount and key change

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    const valueToStore = value instanceof Function ? value(storedValue) : value;
    // Update state immediately for responsiveness
    setStoredValue(valueToStore);

    // Encrypt and save to localStorage in the background
    encrypt(valueToStore)
      .then(encryptedValue => {
        window.localStorage.setItem(key, encryptedValue);
      })
      .catch(error => {
        console.error(`Error encrypting data for key "${key}":`, error);
      });
  }, [key, storedValue]);

  return [storedValue, setValue];
}

export default useLocalStorage;