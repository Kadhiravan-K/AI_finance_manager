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
            // Attempt to decrypt first
            const decryptedValue = await decrypt(item);
            if (isMounted) {
              setStoredValue(decryptedValue as T);
            }
          } catch (decryptionError) {
            // Decryption failed. This is likely old, unencrypted data.
            console.warn(`Decryption failed for key "${key}". Attempting to migrate unencrypted data.`);
            try {
              // Try to parse it as plain JSON
              const oldData = JSON.parse(item);
              if (isMounted) {
                // Set state with the old data to prevent data loss
                setStoredValue(oldData as T);
                console.log(`Successfully migrated data for key "${key}".`);

                // Re-encrypt and save the migrated data in the background
                encrypt(oldData).then(encryptedValue => {
                  window.localStorage.setItem(key, encryptedValue);
                  console.log(`Data for key "${key}" is now encrypted.`);
                });
              }
            } catch (jsonParseError) {
              // The data is not decryptable and not valid JSON. It's likely corrupted.
              console.error(`Failed to migrate data for key "${key}" as it's corrupted. Resetting to initial value.`, jsonParseError);
              // Fallback to initial value
              const valueToStore = initialValue instanceof Function ? initialValue() : initialValue;
              if (isMounted) setStoredValue(valueToStore);
              const encryptedValue = await encrypt(valueToStore);
              window.localStorage.setItem(key, encryptedValue);
            }
          }
        } else {
            // If no item, encrypt and store the initial value for future use
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
