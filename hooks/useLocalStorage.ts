import { useState, useEffect, useCallback } from 'react';
import { encrypt, decrypt } from '../utils/crypto';

function useLocalStorage<T>(key: string, initialValue: T | (() => T)): [T, (value: T | ((val: T) => T)) => Promise<void>] {
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
            // 1. Assume it's new, encrypted data and try to decrypt.
            const decryptedValue = await decrypt(item);
            if (isMounted) {
              setStoredValue(decryptedValue as T);
            }
          } catch (decryptionError) {
            // 2. Decryption failed. Assume it's old, unencrypted data.
            // This could be JSON or a primitive string. Try to parse.
            console.warn(`Decryption failed for key "${key}". Attempting to migrate as unencrypted data.`);
            try {
              const parsedData = JSON.parse(item);
              if (isMounted) {
                setStoredValue(parsedData as T);
              }
              // If successful, encrypt and save for next time.
              const encryptedValue = await encrypt(parsedData);
              window.localStorage.setItem(key, encryptedValue);
              console.log(`Successfully migrated unencrypted data for key "${key}".`);
            } catch (parsingError) {
              // 3. Failed both decryption and parsing. Data is likely corrupt. Reset.
              console.error(
                `Decryption and JSON parsing failed for key "${key}". The data may be corrupted or the encryption key has changed. Resetting to initial value to prevent application instability.`,
                parsingError
              );
              const valueToStore = initialValue instanceof Function ? initialValue() : initialValue;
              if (isMounted) setStoredValue(valueToStore);
              
              const encryptedValue = await encrypt(valueToStore);
              window.localStorage.setItem(key, encryptedValue);
            }
          }
        } else {
          // 4. No data exists, initialize it for the first time.
          const valueToStore = initialValue instanceof Function ? initialValue() : initialValue;
          if (isMounted) setStoredValue(valueToStore);
          const encryptedValue = await encrypt(valueToStore);
          window.localStorage.setItem(key, encryptedValue);
        }
      } catch (error) {
        console.error(`An unexpected error occurred while loading data for key "${key}":`, error);
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

  const setValue = useCallback(async (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      // Update state immediately for responsiveness
      setStoredValue(valueToStore);
      const encryptedValue = await encrypt(valueToStore);
      window.localStorage.setItem(key, encryptedValue);
    } catch (error) {
        console.error(`Error saving data for key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
}

export default useLocalStorage;