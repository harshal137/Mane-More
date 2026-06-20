// components/ScrollToTop.js
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Restores the viewport to the top after storefront navigation. */
const ScrollToTop = () => {
  const { hash, pathname } = useLocation();

  useEffect(() => {
    if (hash) {
      setTimeout(() => {
        document
          .getElementById(hash.slice(1))
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 0);
      return;
    }

    window.scrollTo(0, 0);
  }, [hash, pathname]);

  return null;
};

export default ScrollToTop;
