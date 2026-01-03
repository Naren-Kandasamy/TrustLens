
import { useState, useEffect } from 'react';

interface Dimensions {
  width: number;
  height: number;
}

export const useImageDimensions = (src: string | null): Dimensions | null => {
  const [dimensions, setDimensions] = useState<Dimensions | null>(null);

  useEffect(() => {
    if (!src) {
        setDimensions(null);
        return;
    }

    const img = new Image();
    img.onload = () => {
      setDimensions({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };
    img.onerror = () => {
        console.error(`Failed to load image from src: ${src}`);
        setDimensions(null);
    }
    img.src = src;

  }, [src]);

  return dimensions;
};
