import { useState, useEffect, useCallback } from 'react';
import { encrypt, decrypt } from '../utils/crypto';

function useLocalStorage<T>(key: string, initialValue: T | (() => T)): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    return initialValue instanceof Function ? initialValue() : initialValue;
  });

  // useEffect to load and decrypt data from localStorage on mount
  useEffect(() => {
    let isMounted = true;
    
    const loadAndDecrypt = async () => {
      try {
        const item = window.localStorage.getItem(key);

        if (item) {
          try {
            // Attempt to decrypt the stored item.
            const decryptedValue = await decrypt(item);
            if (isMounted) {
              setStoredValue(decryptedValue as T);
            }
          } catch (error) {
            // If decryption fails, the data is considered corrupted or the key has changed.
            // This is a critical failure for this data slice. We must reset to a known good state.
            console.error(
              `Decryption failed for key "${key}". The data may be corrupted or the encryption key has changed. Resetting to initial value to prevent application instability.`, 
              error
            );
            // Fallback to the initial value to ensure the app remains functional.
            const valueToStore = initialValue instanceof Function ? initialValue() : initialValue;
            if (isMounted) setStoredValue(valueToStore);
            
            // Re-encrypt and save the known good initial state.
            const encryptedValue = await encrypt(valueToStore);
            window.localStorage.setItem(key, encryptedValue);
          }
        } else {
            // If no item, encrypt and store the initial value for future use.
             const valueToStore = initialValue instanceof Function ? initialValue() : initialValue;
             if (isMounted) setStoredValue(valueToStore); // ensure state is consistent
             const encryptedValue = await encrypt(valueToStore);
             window.localStorage.setItem(key, encryptedValue);
        }
      } catch (error) {
        console.error(`An unexpected error occurred while loading data for key "${key}":`, error);
        // Generic fallback
        const valueToStore = initialValue instanceof Function ? initialValue() : initialValue;
        if (isMounted) setStoredValue(valueToStore);
      }
    };
    
    loadAndDecrypt();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
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
    } catch (error) {
        console.error(error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
}

export default useLocalStorage;