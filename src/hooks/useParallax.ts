import { useEffect, useState, useRef, RefObject } from 'react';

interface ParallaxOptions {
  speed?: number;
  direction?: 'up' | 'down';
  easing?: boolean;
}

export function useParallax<T extends HTMLElement>(
  options: ParallaxOptions = {}
): [RefObject<T>, { y: number; opacity: number }] {
  const { speed = 0.5, direction = 'up', easing = true } = options;
  const ref = useRef<T>(null);
  const [transform, setTransform] = useState({ y: 0, opacity: 1 });

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;

      const rect = ref.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const elementCenter = rect.top + rect.height / 2;
      const distanceFromCenter = elementCenter - windowHeight / 2;
      
      const multiplier = direction === 'up' ? -1 : 1;
      const y = distanceFromCenter * speed * multiplier * 0.1;
      
      // Calculate opacity based on visibility
      const visibleRatio = Math.max(0, Math.min(1, 
        (windowHeight - rect.top) / (windowHeight + rect.height)
      ));
      const opacity = Math.min(1, visibleRatio * 1.5);

      if (easing) {
        requestAnimationFrame(() => {
          setTransform({ y, opacity });
        });
      } else {
        setTransform({ y, opacity });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial calculation

    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed, direction, easing]);

  return [ref, transform];
}

export function useScrollReveal<T extends HTMLElement>(
  threshold: number = 0.1
): [RefObject<T>, boolean] {
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return [ref, isVisible];
}

export function useMouseParallax(sensitivity: number = 0.02) {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      
      const x = (e.clientX - centerX) * sensitivity;
      const y = (e.clientY - centerY) * sensitivity;
      
      requestAnimationFrame(() => {
        setPosition({ x, y });
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [sensitivity]);

  return position;
}
