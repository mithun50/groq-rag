import React from "react";
import { useCurrentFrame, spring, interpolate } from "remotion";
import { COLORS, GRADIENTS } from "../utils/colors";
import { SPRING_CONFIGS, FPS } from "../utils/animations";

interface GlowTextProps {
  children: React.ReactNode;
  fontSize?: number;
  color?: string;
  glowColor?: string;
  animate?: boolean;
  delay?: number;
  gradient?: boolean;
}

export const GlowText: React.FC<GlowTextProps> = ({
  children,
  fontSize = 48,
  color = COLORS.white,
  glowColor = COLORS.primary,
  animate = true,
  delay = 0,
  gradient = false,
}) => {
  const frame = useCurrentFrame();

  const springProgress = animate
    ? spring({
        frame: frame - delay,
        fps: FPS,
        config: SPRING_CONFIGS.gentle,
        durationInFrames: 45,
      })
    : 1;

  const opacity = interpolate(springProgress, [0, 1], [0, 1]);
  const scale = interpolate(springProgress, [0, 1], [0.9, 1]);

  const glowIntensity = interpolate(
    Math.sin(frame * 0.04),
    [-1, 1],
    [0.5, 1]
  );

  const textStyle: React.CSSProperties = {
    fontSize,
    fontWeight: 700,
    fontFamily: "Inter, system-ui, sans-serif",
    opacity,
    transform: `scale(${scale})`,
    textShadow: `0 0 ${20 * glowIntensity}px ${glowColor}80, 0 0 ${40 * glowIntensity}px ${glowColor}40`,
  };

  if (gradient) {
    return (
      <span
        style={{
          ...textStyle,
          background: GRADIENTS.text,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {children}
      </span>
    );
  }

  return (
    <span style={{ ...textStyle, color }}>
      {children}
    </span>
  );
};

interface AnimatedTextProps {
  text: string;
  fontSize?: number;
  color?: string;
  delay?: number;
  staggerDelay?: number;
}

export const AnimatedText: React.FC<AnimatedTextProps> = ({
  text,
  fontSize = 32,
  color = COLORS.white,
  delay = 0,
  staggerDelay = 2,
}) => {
  const frame = useCurrentFrame();
  const words = text.split(" ");

  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
      {words.map((word, index) => {
        const wordDelay = delay + index * staggerDelay;
        const springProgress = spring({
          frame: frame - wordDelay,
          fps: FPS,
          config: SPRING_CONFIGS.gentle,
          durationInFrames: 30,
        });

        const opacity = interpolate(springProgress, [0, 1], [0, 1]);
        const translateY = interpolate(springProgress, [0, 1], [20, 0]);

        return (
          <span
            key={index}
            style={{
              fontSize,
              color,
              fontFamily: "Inter, system-ui, sans-serif",
              fontWeight: 500,
              opacity,
              transform: `translateY(${translateY}px)`,
              display: "inline-block",
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};
