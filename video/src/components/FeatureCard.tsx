import React from "react";
import { useCurrentFrame, spring, interpolate } from "remotion";
import { COLORS, GRADIENTS } from "../utils/colors";
import { SPRING_CONFIGS, FPS } from "../utils/animations";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  delay?: number;
  index?: number;
  color?: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  icon,
  delay = 0,
  index = 0,
  color = COLORS.primary,
}) => {
  const frame = useCurrentFrame();

  const springProgress = spring({
    frame: frame - delay,
    fps: FPS,
    config: SPRING_CONFIGS.bouncy,
    durationInFrames: 45,
  });

  const opacity = interpolate(springProgress, [0, 1], [0, 1]);
  const translateY = interpolate(springProgress, [0, 1], [50, 0]);
  const scale = interpolate(springProgress, [0, 1], [0.8, 1]);

  const glowPulse = interpolate(
    Math.sin(frame * 0.03 + index),
    [-1, 1],
    [0.3, 0.6]
  );

  return (
    <div
      style={{
        width: 320,
        padding: 24,
        backgroundColor: COLORS.backgroundLight,
        borderRadius: 16,
        border: `1px solid ${color}30`,
        opacity,
        transform: `translateY(${translateY}px) scale(${scale})`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Glow Effect */}
      <div
        style={{
          position: "absolute",
          top: -50,
          right: -50,
          width: 150,
          height: 150,
          background: `radial-gradient(circle, ${color}${Math.floor(glowPulse * 40).toString(16).padStart(2, '0')} 0%, transparent 70%)`,
          filter: "blur(30px)",
          pointerEvents: "none",
        }}
      />

      {/* Icon */}
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 12,
          backgroundColor: `${color}20`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
          color: color,
        }}
      >
        {icon}
      </div>

      {/* Title */}
      <h3
        style={{
          fontSize: 20,
          fontWeight: 600,
          color: COLORS.white,
          marginBottom: 8,
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        {title}
      </h3>

      {/* Description */}
      <p
        style={{
          fontSize: 14,
          color: COLORS.gray[400],
          lineHeight: 1.5,
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        {description}
      </p>
    </div>
  );
};

// Feature Icons
export const RAGIcon: React.FC<{ size?: number }> = ({ size = 28 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    <line x1="8" y1="6" x2="16" y2="6" />
    <line x1="8" y1="10" x2="16" y2="10" />
    <line x1="8" y1="14" x2="12" y2="14" />
  </svg>
);

export const WebSearchIcon: React.FC<{ size?: number }> = ({ size = 28 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
    <path d="M11 8a3 3 0 0 0-3 3" />
  </svg>
);

export const AgentIcon: React.FC<{ size?: number }> = ({ size = 28 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 8V4H8" />
    <rect width="16" height="12" x="4" y="8" rx="2" />
    <path d="M2 14h2" />
    <path d="M20 14h2" />
    <path d="M15 13v2" />
    <path d="M9 13v2" />
  </svg>
);

export const StreamIcon: React.FC<{ size?: number }> = ({ size = 28 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2 12h6" />
    <path d="M22 12h-6" />
    <path d="M12 2v6" />
    <path d="M12 22v-6" />
    <circle cx="12" cy="12" r="4" />
  </svg>
);

interface FeatureGridProps {
  children: React.ReactNode;
}

export const FeatureGrid: React.FC<FeatureGridProps> = ({ children }) => {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: 24,
        padding: 40,
      }}
    >
      {children}
    </div>
  );
};
