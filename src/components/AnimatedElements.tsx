import React, { useEffect, useRef, useState, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  animation?: 'fade-up' | 'fade-left' | 'fade-right' | 'scale' | 'none';
  delay?: number;
  threshold?: number;
  once?: boolean;
}

export function AnimatedSection({
  children,
  className,
  animation = 'fade-up',
  delay = 0,
  threshold = 0.1,
  once = true,
}: AnimatedSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold, once]);

  const animationClasses = {
    'fade-up': 'animate-fade-in-up',
    'fade-left': 'animate-fade-in-left',
    'fade-right': 'animate-fade-in-right',
    'scale': 'animate-scale-in',
    'none': '',
  };

  return (
    <div
      ref={ref}
      className={cn(
        'opacity-0',
        isVisible && animationClasses[animation],
        className
      )}
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: 'forwards',
      }}
    >
      {children}
    </div>
  );
}

interface ParallaxLayerProps {
  children: ReactNode;
  className?: string;
  speed?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}

export function ParallaxLayer({
  children,
  className,
  speed = 0.5,
  direction = 'up',
}: ParallaxLayerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;

      const rect = ref.current.getBoundingClientRect();
      const scrollProgress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
      const movement = (scrollProgress - 0.5) * 100 * speed;

      let x = 0, y = 0;
      switch (direction) {
        case 'up': y = -movement; break;
        case 'down': y = movement; break;
        case 'left': x = -movement; break;
        case 'right': x = movement; break;
      }

      requestAnimationFrame(() => {
        setOffset({ x, y });
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed, direction]);

  return (
    <div
      ref={ref}
      className={cn('will-change-transform', className)}
      style={{
        transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
        transition: 'transform 0.1s ease-out',
      }}
    >
      {children}
    </div>
  );
}

interface FloatingElementProps {
  children: ReactNode;
  className?: string;
  intensity?: 'subtle' | 'medium' | 'strong';
}

export function FloatingElement({
  children,
  className,
  intensity = 'medium',
}: FloatingElementProps) {
  const animationClass = {
    subtle: 'animate-float',
    medium: 'animate-float-slow',
    strong: 'animate-float-slow',
  };

  return (
    <div className={cn(animationClass[intensity], className)}>
      {children}
    </div>
  );
}

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  strength?: number;
}

export function MagneticButton({
  children,
  className,
  strength = 0.3,
}: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const x = (e.clientX - centerX) * strength;
    const y = (e.clientY - centerY) * strength;

    setPosition({ x, y });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div
      ref={ref}
      className={cn('inline-block transition-transform duration-200', className)}
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
}

interface GlowingCardProps {
  children: ReactNode;
  className?: string;
}

export function GlowingCard({ children, className }: GlowingCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setMousePosition({ x, y });
  };

  return (
    <div
      ref={ref}
      className={cn(
        'relative overflow-hidden transition-all duration-300',
        className
      )}
      onMouseMove={handleMouseMove}
      style={{
        '--mouse-x': `${mousePosition.x}%`,
        '--mouse-y': `${mousePosition.y}%`,
      } as React.CSSProperties}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(400px circle at var(--mouse-x) var(--mouse-y), hsl(var(--gold) / 0.15), transparent 40%)`,
        }}
      />
      {children}
    </div>
  );
}
