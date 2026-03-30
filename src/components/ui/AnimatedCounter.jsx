import { useEffect, useRef } from "react";
import { useInView, useMotionValue, useSpring } from "framer-motion";

/**
 * AnimatedCounter component
 * Animates a number from 0 to `value` when in view.
 * 
 * @param {number} value - The target number to animate to
 * @param {string} className - CSS classes
 * @param {function} formatter - Optional function to format the number (e.g. currency)
 * @param {number} duration - Animation duration in seconds (default 1.5)
 */
export default function AnimatedCounter({ 
  value, 
  className, 
  formatter = (v) => v.toFixed(0),
  duration = 1.5
}) {
  const ref = useRef(null);
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    damping: 30,
    stiffness: 60,
    // Note: duration is not a standard spring prop but kept for compatibility if using custom wrappers
    // For standard springs, stiffness/damping control speed
  });
  
  const isInView = useInView(ref, { once: true, margin: "-10px" });

  useEffect(() => {
    if (isInView) {
      motionValue.set(value);
    }
  }, [motionValue, isInView, value]);

  useEffect(() => {
    // Subscribe to spring changes and update text content directly
    // This avoids React re-renders for every frame of animation
    const unsubscribe = springValue.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = formatter(latest);
      }
    });

    // Set initial value immediately
    if (ref.current) {
        ref.current.textContent = formatter(springValue.get());
    }

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [springValue, formatter]);

  return <span ref={ref} className={className} />;
}