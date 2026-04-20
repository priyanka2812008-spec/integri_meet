import { useEffect } from 'react';

export const useTabVisibility = (onTabSwitch) => {
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab was switched or minimized
        onTabSwitch();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [onTabSwitch]);
};
