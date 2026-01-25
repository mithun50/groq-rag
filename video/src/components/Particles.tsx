import React, { useMemo } from "react";
import { useCurrentFrame, interpolate, random } from "remotion";
import { COLORS } from "../utils/colors";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  delay: number;
}

interface ParticlesProps {
  count?: number;
  minSize?: number;
  maxSize?: number;
  speed?: number;
  direction?: "up" | "down" | "random";
}

// Elegant ambient particles for macOS-inspired theme
export const Particles: React.FC<ParticlesProps> = ({
  count = 30,
  minSize = 1,
  maxSize = 3,
  speed = 0.3,
  direction = "up",
}) => {
  const frame = useCurrentFrame();

  const particles: Particle[] = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: random(`particle-x-${i}`) * 100,
      y: random(`particle-y-${i}`) * 100,
      size: minSize + random(`particle-size-${i}`) * (maxSize - minSize),
      speed: 0.1 + random(`particle-speed-${i}`) * speed,
      opacity: 0.1 + random(`particle-opacity-${i}`) * 0.3,
      delay: random(`particle-delay-${i}`) * 200,
    }));
  }, [count, minSize, maxSize, speed]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {particles.map((particle) => {
        const adjustedFrame = Math.max(0, frame - particle.delay);

        // Vertical movement
        const yOffset = direction === "up"
          ? -(adjustedFrame * particle.speed) % 120
          : direction === "down"
          ? (adjustedFrame * particle.speed) % 120
          : Math.sin(adjustedFrame * 0.02) * 20;

        // Subtle horizontal drift
        const xDrift = Math.sin(adjustedFrame * 0.01 + particle.id) * 10;

        // Fade in/out based on position
        const opacity = interpolate(
          Math.sin(adjustedFrame * 0.02 + particle.id * 0.5),
          [-1, 1],
          [particle.opacity * 0.3, particle.opacity]
        );

        return (
          <div
            key={particle.id}
            style={{
              position: "absolute",
              left: `${particle.x + xDrift * 0.1}%`,
              top: `${((particle.y + yOffset) % 100 + 100) % 100}%`,
              width: particle.size,
              height: particle.size,
              borderRadius: "50%",
              backgroundColor: COLORS.white,
              opacity,
              transform: "translate(-50%, -50%)",
            }}
          />
        );
      })}
    </div>
  );
};

// Spotlight/glow effect - supports custom colors for macOS theme
interface SpotlightProps {
  x: number;
  y: number;
  size?: number;
  intensity?: number;
  pulseSpeed?: number;
  color?: string;  // Custom color (CSS rgba or hex with opacity)
}

export const Spotlight: React.FC<SpotlightProps> = ({
  x,
  y,
  size = 400,
  intensity = 0.08,
  pulseSpeed = 0.015,
  color,
}) => {
  const frame = useCurrentFrame();

  const pulse = interpolate(
    Math.sin(frame * pulseSpeed),
    [-1, 1],
    [0.7, 1]
  );

  // Use custom color or default white with intensity
  const gradientColor = color || `rgba(255,255,255,${intensity})`;

  return (
    <div
      style={{
        position: "absolute",
        left: `${x}%`,
        top: `${y}%`,
        width: size * pulse,
        height: size * pulse,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${gradientColor} 0%, transparent 70%)`,
        transform: "translate(-50%, -50%)",
        filter: "blur(60px)",
        pointerEvents: "none",
      }}
    />
  );
};

// Film grain effect for cinematic look
interface FilmGrainProps {
  intensity?: number;
}

export const FilmGrain: React.FC<FilmGrainProps> = ({ intensity = 0.03 }) => {
  const frame = useCurrentFrame();

  // Create pseudo-random noise pattern that changes each frame
  const seed = frame % 60;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: intensity,
        pointerEvents: "none",
        mixBlendMode: "overlay",
        background: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' seed='${seed}' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
      }}
    />
  );
};

// Vignette effect
interface VignetteProps {
  intensity?: number;
}

export const Vignette: React.FC<VignetteProps> = ({ intensity = 0.6 }) => {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,${intensity}) 100%)`,
        pointerEvents: "none",
      }}
    />
  );
};

// Scanlines for retro CRT effect (subtle)
interface ScanlinesProps {
  opacity?: number;
  spacing?: number;
}

export const Scanlines: React.FC<ScanlinesProps> = ({
  opacity = 0.03,
  spacing = 4
}) => {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `repeating-linear-gradient(
          0deg,
          transparent,
          transparent ${spacing - 1}px,
          rgba(0,0,0,${opacity}) ${spacing - 1}px,
          rgba(0,0,0,${opacity}) ${spacing}px
        )`,
        pointerEvents: "none",
      }}
    />
  );
};

// Keep GlowOrb for backwards compatibility but make it subtle
interface GlowOrbProps {
  x: number;
  y: number;
  size?: number;
  color?: string;
  pulseSpeed?: number;
}

export const GlowOrb: React.FC<GlowOrbProps> = ({
  x,
  y,
  size = 300,
  color = COLORS.white,
  pulseSpeed = 0.02,
}) => {
  const frame = useCurrentFrame();
  const pulse = interpolate(
    Math.sin(frame * pulseSpeed),
    [-1, 1],
    [0.8, 1.2]
  );

  return (
    <div
      style={{
        position: "absolute",
        left: `${x}%`,
        top: `${y}%`,
        width: size * pulse,
        height: size * pulse,
        borderRadius: "50%",
        background: `radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)`,
        transform: "translate(-50%, -50%)",
        filter: "blur(40px)",
        pointerEvents: "none",
      }}
    />
  );
};
