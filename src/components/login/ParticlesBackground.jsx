import React, { useCallback } from 'react';
    import Particles from "react-tsparticles";
    import { loadSlim } from "tsparticles-slim";

    const ParticlesBackground = () => {
      const particlesInit = useCallback(async (engine) => {
        await loadSlim(engine);
      }, []);

      const particlesOptions = {
        background: {
          color: {
            value: "transparent",
          },
        },
        fpsLimit: 60,
        interactivity: {
          events: {
            onHover: {
              enable: true,
              mode: "grab",
            },
            resize: true,
          },
          modes: {
            grab: {
                distance: 140,
                links: {
                    opacity: 0.8
                }
            },
          },
        },
        particles: {
          color: {
            value: ["#34d399", "#60a5fa", "#a78bfa"],
          },
          links: {
            color: "hsl(var(--foreground))",
            distance: 150,
            enable: true,
            opacity: 0.1,
            width: 1,
          },
          collisions: {
            enable: false,
          },
          move: {
            direction: "none",
            enable: true,
            outModes: {
              default: "bounce",
            },
            random: true,
            speed: 1,
            straight: false,
          },
          number: {
            density: {
              enable: true,
              area: 800,
            },
            value: 50,
          },
          opacity: {
            value: {min: 0.1, max: 0.5},
            animation: {
              enable: true,
              speed: 1,
              minimumValue: 0.1,
              sync: false,
            },
          },
          shape: {
            type: "circle",
          },
          size: {
            value: { min: 1, max: 3 },
          },
        },
        detectRetina: true,
      };

      return (
        <Particles
          id="tsparticles"
          init={particlesInit}
          options={particlesOptions}
          className="absolute top-0 left-0 w-full h-full z-0"
        />
      );
    };

    export default ParticlesBackground;