import { useState, useEffect, useRef } from "react";

interface AnimatedNumberProps {
  value: number;
  formatter: (n: number) => string;
}

export function AnimatedNumber({ value, formatter }: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const animationRef = useRef<number>();
  
  useEffect(() => {
    const startValue = displayValue;
    const endValue = value;
    const duration = 400;
    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      
      setDisplayValue(startValue + (endValue - startValue) * eased);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value]);
  
  return <>{formatter(displayValue)}</>;
}
