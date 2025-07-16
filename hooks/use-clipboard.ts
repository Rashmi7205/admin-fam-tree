import { useCallback } from "react";

export function useClipboard() {
  const copy = useCallback(async (text: string) => {
    if (navigator?.clipboard) {
      try {
        await navigator.clipboard.writeText(text);
        // Optionally, you can show a toast here if you have a toast system
        // e.g. toast.success("Copied to clipboard!");
      } catch (err) {
        // Optionally, show an error toast
        // e.g. toast.error("Failed to copy");
      }
    }
  }, []);

  return { copy };
}
