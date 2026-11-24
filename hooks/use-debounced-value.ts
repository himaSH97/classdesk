import { useEffect, useState } from "react";

/**
 * Returns `value` once it has stopped changing for `delay` ms.
 * Controls stay bound to the live value (so they feel instant); expensive work
 * like filtering a list reads the debounced one.
 */
export function useDebouncedValue<T>(value: T, delay = 200): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
