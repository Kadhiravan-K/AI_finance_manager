import { useState, useEffect, useCallback } from 'react';
import { encrypt, decrypt } from '../utils/crypto';

function useLocalStorage<T>(key: string, initialValue: T | (() => T)): [T, (value: T | ((val: T) => T)) => Promise<void>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    return initialValue instanceof Function ? initialValue() : initialValue;
  });

  useEffect(() => {
    let isMounted = true;
    
    const loadAndDecrypt = async () => {
      try {
        const item = window.localStorage.getItem(key);
        if (item) {
          try {
            // Attempt to decrypt first, assuming modern format
            const decryptedValue = await decrypt(item);
            if (isMounted) {
              setStoredValue(decryptedValue as T);
            }
          } catch (decryptionError) {
            // Decryption failed, let's check if it's old, unencrypted JSON data
            console.warn(`Decryption failed for "${key}". Attempting to read as legacy unencrypted data.`);
            try {
                const legacyData = JSON.parse(item);
                console.log(`Successfully parsed legacy data for "${key}". Upgrading to encrypted format.`);
                if (isMounted) setStoredValue(legacyData as T);
                // Immediately encrypt and save to upgrade the data format
                const encryptedValue = await encrypt(legacyData);
                window.localStorage.setItem(key, encryptedValue);
            } catch (jsonParseError) {
                // If both decryption and plain JSON parsing fail, the data is corrupt. Reset to initial.
                console.error(
                  `Decryption and JSON parsing failed for key "${key}". The data may be corrupted or the encryption key has changed. Resetting to initial value to prevent application instability.`, 
                  decryptionError
                );
                
                const valueToStore = initialValue instanceof Function ? initialValue() : initialValue;
                if (isMounted) setStoredValue(valueToStore);
                
                try {
                  const encryptedValue = await encrypt(valueToStore);
                  window.localStorage.setItem(key, encryptedValue);
                } catch (encryptionError) {
                  console.error(`Failed to re-encrypt initial value for key "${key}" after a reset.`, encryptionError);
                }
            }
          }
        } else {
          // No data exists, initialize it for the first time.
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