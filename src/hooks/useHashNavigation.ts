import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook that handles smooth scrolling to hash anchors when navigating with React Router
 * This ensures that links like "/#section" work correctly from any page
 */
export const useHashNavigation = () => {
  const location = useLocation();

  useEffect(() => {
    // If there's a hash in the URL, scroll to that element
    if (location.hash) {
      // Small delay to ensure the page has rendered
      const timeoutId = setTimeout(() => {
        const element = document.querySelector(location.hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    } else {
      // If no hash, scroll to top when navigating to a new page
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location.pathname, location.hash]);
};

export default useHashNavigation;
