import { useRef, useState, useEffect } from 'react';

/**
 * Hook pour animer les éléments lors du scroll
 * Utilise IntersectionObserver pour détecter quand un élément devient visible
 */
export const useScrollAnimation = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
};

export default useScrollAnimation;
