import React from "react";
import { useCurrentFrame, spring, interpolate } from "remotion";
import { COLORS, GRADIENTS } from "../utils/colors";
import { SPRING_CONFIGS, FPS } from "../utils/animations";

interface LogoProps {
  scale?: number;
  showGlow?: boolean;
  animate?: boolean;
  delay?: number;
}

export const Logo: React.FC<LogoProps> = ({
  scale = 1,
  showGlow = true,
  animate = true,
  delay = 0,
}) => {
  const frame = useCurrentFrame();

  const springProgress = animate
    ? spring({
        frame: frame - delay,
        fps: FPS,
        config: SPRING_CONFIGS.bouncy,
        durationInFrames: 60,
      })
    : 1;

  const opacity = interpolate(springProgress, [0, 0.5, 1], [0, 0.8, 1]);
  const scaleAnim = interpolate(springProgress, [0, 1], [0.5, 1]) * scale;

  const glowPulse = interpolate(
    Math.sin(frame * 0.05),
    [-1, 1],
    [0.5, 1]
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
        opacity,
        transform: `scale(${scaleAnim})`,
      }}
    >
      {showGlow && (
        <div
          style={{
            position: "absolute",
            width: 400 * scale,
            height: 200 * scale,
            background: `radial-gradient(ellipse, ${COLORS.primary}${Math.floor(glowPulse * 40).toString(16).padStart(2, '0')} 0%, transparent 70%)`,
            filter: "blur(60px)",
            zIndex: -1,
          }}
        />
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12 * scale,
        }}
      >
        {/* Logo Icon */}
        <div
          style={{
            width: 80 * scale,
            height: 80 * scale,
            borderRadius: 20 * scale,
            background: GRADIENTS.primary,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 ${40 * glowPulse}px ${COLORS.primary}60`,
          }}
        >
          <svg
            width={50 * scale}
            height={50 * scale}
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>

        {/* Logo Text */}
        <div
          style={{
            fontSize: 64 * scale,
            fontWeight: 700,
            fontFamily: "Inter, system-ui, sans-serif",
            background: GRADIENTS.text,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "-0.02em",
          }}
        >
          groq-rag
        </div>
      </div>
    </div>
  );
};

interface TaglineProps {
  text?: string;
  delay?: number;
  scale?: number;
}

export const Tagline: React.FC<TaglineProps> = ({
  text = "Build Intelligent AI Apps with RAG, Web & Agents",
  delay = 30,
  scale = 1,
}) => {
  const frame = useCurrentFrame();

  const springProgress = spring({
    frame: frame - delay,
    fps: FPS,
    config: SPRING_CONFIGS.gentle,
    durationInFrames: 45,
  });

  const opacity = interpolate(springProgress, [0, 1], [0, 1]);
  const translateY = interpolate(springProgress, [0, 1], [20, 0]);

  return (
    <div
      style={{
        fontSize: 28 * scale,
        color: COLORS.gray[300],
        fontFamily: "Inter, system-ui, sans-serif",
        fontWeight: 400,
        opacity,
        transform: `translateY(${translateY}px)`,
        textAlign: "center",
      }}
    >
      {text}
    </div>
  );
};
