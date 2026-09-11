import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce rapid value changes (e.g., search input)
 * @param value The value to debounce
 * @param delay Milliseconds to delay
 */
export function useDebounce<T>(value: T, delay: number = 250): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
