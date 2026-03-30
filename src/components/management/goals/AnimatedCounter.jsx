import { animate } from "framer-motion";
import React, { useEffect, useRef } from "react";

function AnimatedCounter({ value, formatFunc }) {
  const nodeRef = useRef();

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;

    const from = parseFloat(node.textContent.replace(/[^\d.,-]/g, '').replace(',', '.')) || 0;
    
    // Check if the value is a number, if not, display it directly
    if (isNaN(value)) {
        node.textContent = value;
        return;
    }
    
    const controls = animate(from, value, {
      duration: 1.5,
      ease: "easeOut",
      onUpdate(value) {
        node.textContent = formatFunc ? formatFunc(value) : Math.round(value).toString();
      }
    });

    return () => controls.stop();
  }, [value, formatFunc]);

  const initialDisplay = formatFunc ? formatFunc(0) : "0";

  return <span ref={nodeRef}>{initialDisplay}</span>;
}

export default AnimatedCounter;