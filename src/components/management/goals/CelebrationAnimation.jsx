import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Rocket } from 'lucide-react';
import confetti from 'canvas-confetti';

const CelebrationAnimation = ({ onAnimationComplete }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        const myConfetti = confetti.create(canvasRef.current, {
            resize: true,
            useWorker: true,
        });

        const duration = 2.5 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

        function randomInRange(min, max) {
            return Math.random() * (max - min) + min;
        }

        const interval = setInterval(() => {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                clearInterval(interval);
                if (onAnimationComplete) {
                    onAnimationComplete();
                }
                return;
            }

            const particleCount = 50 * (timeLeft / duration);
            myConfetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            myConfetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);

        return () => {
            clearInterval(interval);
        };
    }, [onAnimationComplete]);

    return (
        <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden">
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
            <motion.div
                className="absolute bottom-0 left-1/2"
                initial={{ y: 50, x: '-50%', opacity: 0, scale: 1.5 }}
                animate={{
                    y: -300,
                    opacity: [0, 1, 1, 0],
                    rotate: -45,
                }}
                transition={{
                    duration: 2.5,
                    ease: 'easeInOut',
                    opacity: { times: [0, 0.1, 0.9, 1] }
                }}
            >
                <Rocket className="w-16 h-16 text-orange-500 drop-shadow-lg" />
            </motion.div>
        </div>
    );
};

export default CelebrationAnimation;