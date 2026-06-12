import { ImgHTMLAttributes, useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  webpSrc?: string;
  fallbackSrc?: string;
  blurPlaceholder?: boolean;
  priority?: boolean;
}

/**
 * Composant d'image optimisée avec:
 * - Support WebP avec fallback automatique
 * - Lazy loading avec IntersectionObserver
 * - Blur placeholder pendant le chargement
 * - Transition fluide à l'apparition
 */
const OptimizedImage = ({ 
  src, 
  alt, 
  webpSrc,
  fallbackSrc,
  className,
  loading,
  decoding = 'async',
  blurPlaceholder = true,
  priority = false,
  style,
  ...props 
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);

  // Générer le chemin WebP si non fourni et si l'image est un JPG/PNG
  const autoWebpSrc = webpSrc || (src.match(/\.(jpg|jpeg|png)$/i) ? src.replace(/\.(jpg|jpeg|png)$/i, '.webp') : null);
  const isConvertible = !!autoWebpSrc;

  // IntersectionObserver pour le lazy loading
  useEffect(() => {
    if (priority) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px 0px', // Charger 50px avant d'être visible
        threshold: 0.01
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const imageClasses = cn(
    'transition-all duration-500',
    blurPlaceholder && !isLoaded && 'blur-sm scale-105',
    isLoaded && 'blur-0 scale-100',
    className
  );

  const combinedStyle = {
    ...style,
    opacity: isInView ? 1 : 0,
  };

  // Image avec support WebP
  if (isConvertible && isInView) {
    return (
      <picture>
        <source srcSet={autoWebpSrc} type="image/webp" />
        <source srcSet={src} type={src.endsWith('.png') ? 'image/png' : 'image/jpeg'} />
        <img
          ref={imgRef}
          src={fallbackSrc || src}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding={decoding}
          className={imageClasses}
          style={combinedStyle}
          onLoad={handleLoad}
          {...props}
        />
      </picture>
    );
  }

  // Placeholder avant le chargement
  if (!isInView) {
    return (
      <div 
        ref={imgRef as React.RefObject<HTMLDivElement>}
        className={cn('bg-muted animate-pulse', className)}
        style={{ aspectRatio: props.width && props.height ? `${props.width}/${props.height}` : 'auto' }}
        aria-hidden="true"
      />
    );
  }

  // Image standard
  return (
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding={decoding}
      className={imageClasses}
      style={combinedStyle}
      onLoad={handleLoad}
      {...props}
    />
  );
};

export default OptimizedImage;
