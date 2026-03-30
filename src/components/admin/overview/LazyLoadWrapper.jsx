import React from 'react';
    import { useInView } from 'react-intersection-observer';
    import { Loader2 } from 'lucide-react';
    import { motion } from 'framer-motion';

    const LazyLoadWrapper = ({ children, placeholderHeight = '250px', rootMargin = '200px 0px' }) => {
      const { ref, inView } = useInView({
        triggerOnce: true,
        rootMargin: rootMargin,
      });

      return (
        <div ref={ref} style={{ minHeight: inView ? 'auto' : placeholderHeight }} className="w-full">
          {inView ? (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              {children}
            </motion.div>
          ) : (
            <div className="flex items-center justify-center w-full" style={{ height: placeholderHeight }}>
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}
        </div>
      );
    };

    export default LazyLoadWrapper;